const Pedido = require('../models/pedidoModel')
const Plato = require('../models/platoModel')
const Mesa = require('../models/mesaModel')
const MesaService = require('./mesaService')

const mesaService = new MesaService()

const TRANSICIONES = {
  CREADO: ['EN_COCINA', 'CANCELADO'],
  EN_COCINA: ['LISTO', 'CANCELADO'],
  LISTO: ['ENTREGADO'],
  ENTREGADO: [],
  PAGADO: [],
  CANCELADO: []
}

const METODOS_PAGO = ['Tarjeta', 'Yape / Plin', 'Efectivo']

class PedidoService {
  async getAll() {
    const pedidos = await Pedido.find()
    return pedidos.sort((a, b) => b.createdAt - a.createdAt)
  }

  async getById(id) {
    return Pedido.findById(id)
  }

  async getActivosCocina() {
    const pedidos = await Pedido.find()
    return pedidos
      .filter((p) => p.estado === 'CREADO' || p.estado === 'EN_COCINA')
      .sort((a, b) => a.createdAt - b.createdAt)
  }

  async getActivosMozo() {
    const pedidos = await Pedido.find()
    const activos = ['LISTO', 'EN_COCINA', 'CREADO', 'ENTREGADO']
    const prioridad = { LISTO: 0, EN_COCINA: 1, CREADO: 2, ENTREGADO: 3 }
    return pedidos
      .filter((p) => activos.includes(p.estado))
      .sort((a, b) => prioridad[a.estado] - prioridad[b.estado] || a.createdAt - b.createdAt)
  }

  async getActivoPorMesa(mesaCodigo) {
    const codigo = typeof mesaCodigo === 'string' ? mesaCodigo.trim().toUpperCase() : ''
    if (!codigo) return null
    const mesa = await Mesa.findOne({ codigo })
    if (!mesa || !mesa.pedidoActivoId) return null
    return Pedido.findById(mesa.pedidoActivoId)
  }

  async createPedido({ mesaCodigo, items, notasGenerales = '', creadoPor = 'Cliente QR' }) {
    const codigoMesa = typeof mesaCodigo === 'string' ? mesaCodigo.trim().toUpperCase() : ''
    const mesa = await Mesa.findOne({ codigo: codigoMesa })
    if (!mesa) {
      throw new Error('Mesa no encontrada')
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Debe agregar al menos un plato al pedido')
    }

    const detalleItems = []
    let total = 0
    let tiempoEstimado = 0

    for (const item of items) {
      const cantidad = Number(item.cantidad)
      if (!item.platoId || !Number.isInteger(cantidad) || cantidad <= 0) {
        throw new Error('Cada plato debe tener una cantidad entera positiva')
      }
      const plato = await Plato.findById(item.platoId)
      if (!plato || !plato.activo) {
        throw new Error('Uno de los platos seleccionados no está disponible')
      }
      const subtotal = Number((plato.precio * cantidad).toFixed(2))
      total += subtotal
      tiempoEstimado = Math.max(tiempoEstimado, plato.tiempoPrepMin || 10)
      detalleItems.push({
        platoId: plato.id,
        nombre: plato.nombre,
        icono: plato.icono || '🍽️',
        cantidad,
        precio: plato.precio,
        subtotal,
        notas: typeof item.notas === 'string' ? item.notas.trim().slice(0, 120) : ''
      })
    }

    total = Number(total.toFixed(2))

    // Si la mesa ya tiene un pedido activo no pagado, anexamos los nuevos platos y reenviamos a cocina
    if (mesa.pedidoActivoId) {
      const pedidoActual = await Pedido.findById(mesa.pedidoActivoId)
      if (pedidoActual && !['PAGADO', 'CANCELADO'].includes(pedidoActual.estado)) {
        const nuevosItems = [...pedidoActual.items]
        for (const nuevo of detalleItems) {
          const existente = nuevosItems.find(
            (x) => x.platoId === nuevo.platoId && (x.notas || '') === (nuevo.notas || '')
          )
          if (existente) {
            existente.cantidad += nuevo.cantidad
            existente.subtotal = Number((existente.cantidad * existente.precio).toFixed(2))
          } else {
            nuevosItems.push(nuevo)
          }
        }
        const nuevoTotal = Number(nuevosItems.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2))
        const estadoReenvio = pedidoActual.estado === 'ENTREGADO' || pedidoActual.estado === 'LISTO'
          ? 'CREADO'
          : pedidoActual.estado

        const pedidoActualizado = await Pedido.updateById(pedidoActual.id, {
          items: nuevosItems,
          total: nuevoTotal,
          estado: estadoReenvio,
          notasGenerales: notasGenerales ? String(notasGenerales).trim() : pedidoActual.notasGenerales
        })

        return { pedido: pedidoActualizado, mesa, esAdicional: true }
      }
    }

    const totalPedidos = await Pedido.countDocuments()
    const codigoPedido = `PED-${String(totalPedidos + 1).padStart(4, '0')}`

    const pedido = await Pedido.create({
      codigo: codigoPedido,
      mesaCodigo: mesa.codigo,
      items: detalleItems,
      notasGenerales: typeof notasGenerales === 'string' ? notasGenerales.trim().slice(0, 200) : '',
      estado: 'CREADO',
      total,
      tiempoEstimadoMin: tiempoEstimado,
      metodoPago: null,
      comprobante: null,
      creadoPor,
      startedAt: null,
      readyAt: null,
      deliveredAt: null,
      paidAt: null
    })

    const mesaActualizada = await Mesa.updateById(mesa.id, {
      estado: 'OCUPADA',
      pedidoActivoId: pedido.id,
      llamandoMozo: false,
      motivoLlamado: null
    })

    return { pedido, mesa: mesaActualizada, esAdicional: false }
  }

  async actualizarEstado(id, nuevoEstado) {
    const pedido = await Pedido.findById(id)
    if (!pedido) {
      throw new Error('Pedido no encontrado')
    }
    const permitidos = TRANSICIONES[pedido.estado] || []
    if (!permitidos.includes(nuevoEstado)) {
      throw new Error(`No se puede pasar de ${pedido.estado} a ${nuevoEstado}`)
    }

    const now = Date.now()
    const patch = { estado: nuevoEstado }
    if (nuevoEstado === 'EN_COCINA') patch.startedAt = now
    if (nuevoEstado === 'LISTO') patch.readyAt = now
    if (nuevoEstado === 'ENTREGADO') patch.deliveredAt = now

    const updated = await Pedido.updateById(id, patch)

    let mesaActualizada = null
    if (nuevoEstado === 'CANCELADO') {
      mesaActualizada = await mesaService.liberarMesa(pedido.mesaCodigo)
    }

    return { pedido: updated, mesa: mesaActualizada }
  }

  async pagarPedido(id, metodoPago) {
    const pedido = await Pedido.findById(id)
    if (!pedido) {
      throw new Error('Pedido no encontrado')
    }
    if (pedido.estado === 'PAGADO') {
      throw new Error('Este pedido ya fue pagado')
    }
    if (pedido.estado === 'CANCELADO') {
      throw new Error('No se puede pagar un pedido cancelado')
    }
    if (!METODOS_PAGO.includes(metodoPago)) {
      throw new Error('Método de pago no válido')
    }

    const now = Date.now()
    const comprobante = `BOL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
    const pedidoPagado = await Pedido.updateById(id, {
      estado: 'PAGADO',
      metodoPago,
      comprobante,
      paidAt: now
    })

    const mesaActualizada = await mesaService.liberarMesa(pedido.mesaCodigo)
    return { pedido: pedidoPagado, mesa: mesaActualizada }
  }
}

module.exports = PedidoService
