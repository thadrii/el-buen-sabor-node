const PedidoService = require('../services/pedidoService')

const pedidoService = new PedidoService()

exports.getAllPedidos = async (req, res) => {
  try {
    const pedidos = await pedidoService.getAll()
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getPedidosCocina = async (req, res) => {
  try {
    const pedidos = await pedidoService.getActivosCocina()
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getPedidosMozo = async (req, res) => {
  try {
    const pedidos = await pedidoService.getActivosMozo()
    res.status(200).json(pedidos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getPedidoPorMesa = async (req, res) => {
  try {
    const pedido = await pedidoService.getActivoPorMesa(req.params.codigo)
    res.status(200).json(pedido)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createPedido = async (req, res) => {
  try {
    const creadoPor = req.user ? (req.user.nombre || req.user.email) : `Mesa ${req.body.mesaCodigo}`
    const { pedido, mesa, esAdicional } = await pedidoService.createPedido({
      mesaCodigo: req.body.mesaCodigo,
      items: req.body.items,
      notasGenerales: req.body.notasGenerales,
      creadoPor
    })

    const io = req.app.get('io')
    if (io) {
      io.to('role:cocinero').to('role:mozo').to('role:admin').emit('pedidoNuevo', {
        pedido,
        mesa,
        esAdicional
      })
      io.to('role:mozo').to('role:admin').emit('mesaActualizada', mesa)
      io.to(`mesa:${pedido.mesaCodigo}`).emit('pedidoActualizado', pedido)
      io.to(`mesa:${pedido.mesaCodigo}`).emit('mesaActualizada', mesa)
    }

    res.status(201).json({
      message: esAdicional ? 'Platos agregados y enviados a cocina' : 'Pedido enviado a cocina',
      pedido,
      mesa
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.actualizarEstado = async (req, res) => {
  try {
    const { estado } = req.body
    const { pedido, mesa } = await pedidoService.actualizarEstado(req.params.id, estado)

    const io = req.app.get('io')
    if (io) {
      io.to('role:cocinero').to('role:mozo').to('role:admin').emit('pedidoActualizado', pedido)
      io.to(`mesa:${pedido.mesaCodigo}`).emit('pedidoActualizado', pedido)

      if (pedido.estado === 'LISTO') {
        io.to('role:mozo').to('role:admin').emit('pedidoListo', {
          pedido,
          mensaje: `${pedido.mesaCodigo} listo para llevar (${pedido.codigo})`
        })
      }

      if (mesa) {
        io.to('role:mozo').to('role:admin').emit('mesaActualizada', mesa)
        io.to(`mesa:${pedido.mesaCodigo}`).emit('mesaActualizada', mesa)
      }
    }

    res.status(200).json({ message: `Pedido actualizado a ${pedido.estado}`, pedido })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.pagarPedido = async (req, res) => {
  try {
    const metodoPago = req.body?.metodoPago || 'Tarjeta'
    const { pedido, mesa } = await pedidoService.pagarPedido(req.params.id, metodoPago)

    const io = req.app.get('io')
    if (io) {
      io.to('role:cocinero').to('role:mozo').to('role:admin').emit('pedidoPagado', { pedido, mesa })
      io.to('role:mozo').to('role:admin').emit('mesaActualizada', mesa)
      io.to(`mesa:${pedido.mesaCodigo}`).emit('pedidoActualizado', pedido)
      io.to(`mesa:${pedido.mesaCodigo}`).emit('mesaActualizada', mesa)
    }

    res.status(200).json({
      message: 'Pago aprobado correctamente',
      pedido,
      mesa
    })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
