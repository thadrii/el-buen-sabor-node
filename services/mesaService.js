const Mesa = require('../models/mesaModel')
const Pedido = require('../models/pedidoModel')

class MesaService {
  async getAll() {
    const mesas = await Mesa.find()
    return mesas.sort((a, b) => a.numero - b.numero)
  }

  async getByCodigo(codigo) {
    if (typeof codigo !== 'string') return null
    return Mesa.findOne({ codigo: codigo.trim().toUpperCase() })
  }

  async getDetalleConPedido(codigo) {
    const mesa = await this.getByCodigo(codigo)
    if (!mesa) return null
    let pedidoActivo = null
    if (mesa.pedidoActivoId) {
      pedidoActivo = await Pedido.findById(mesa.pedidoActivoId)
    }
    return { mesa, pedidoActivo }
  }

  async llamarMozo(codigo, motivo = 'Asistencia en mesa') {
    const mesa = await this.getByCodigo(codigo)
    if (!mesa) {
      throw new Error('Mesa no encontrada')
    }
    const updated = await Mesa.updateById(mesa.id, {
      llamandoMozo: true,
      motivoLlamado: motivo,
      ultimoLlamadoAt: Date.now()
    })
    return updated
  }

  async pedirCuenta(codigo) {
    const mesa = await this.getByCodigo(codigo)
    if (!mesa) {
      throw new Error('Mesa no encontrada')
    }
    const updated = await Mesa.updateById(mesa.id, {
      estado: 'PIDIENDO_CUENTA',
      llamandoMozo: true,
      motivoLlamado: 'Solicita la cuenta en mesa',
      ultimoLlamadoAt: Date.now()
    })
    return updated
  }

  async atenderLlamado(codigo) {
    const mesa = await this.getByCodigo(codigo)
    if (!mesa) {
      throw new Error('Mesa no encontrada')
    }
    const nuevoEstado = mesa.pedidoActivoId ? 'OCUPADA' : 'LIBRE'
    return Mesa.updateById(mesa.id, {
      estado: nuevoEstado,
      llamandoMozo: false,
      motivoLlamado: null
    })
  }

  async liberarMesa(codigo) {
    const mesa = await this.getByCodigo(codigo)
    if (!mesa) return null
    return Mesa.updateById(mesa.id, {
      estado: 'LIBRE',
      pedidoActivoId: null,
      llamandoMozo: false,
      motivoLlamado: null
    })
  }
}

module.exports = MesaService
