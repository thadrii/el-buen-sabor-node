const MesaService = require('../services/mesaService')

const mesaService = new MesaService()

exports.getAllMesas = async (req, res) => {
  try {
    const mesas = await mesaService.getAll()
    res.status(200).json(mesas)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.getMesa = async (req, res) => {
  try {
    const detalle = await mesaService.getDetalleConPedido(req.params.codigo)
    if (!detalle) {
      return res.status(404).json({ message: 'Mesa no encontrada' })
    }
    res.status(200).json(detalle)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.llamarMozo = async (req, res) => {
  try {
    const motivo = typeof req.body?.motivo === 'string' && req.body.motivo.trim()
      ? req.body.motivo.trim().slice(0, 120)
      : 'Cliente solicita atención en mesa'

    const mesa = await mesaService.llamarMozo(req.params.codigo, motivo)
    const io = req.app.get('io')
    if (io) {
      io.to('role:mozo').to('role:admin').emit('alertaMesa', {
        mesa,
        tipo: 'LLAMAR_MOZO',
        mensaje: `${mesa.codigo}: ${motivo}`
      })
      io.to('role:mozo').to('role:admin').emit('mesaActualizada', mesa)
      io.to(`mesa:${mesa.codigo}`).emit('mesaActualizada', mesa)
    }

    res.status(200).json({ message: 'Mozo notificado en tiempo real', mesa })
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

exports.pedirCuenta = async (req, res) => {
  try {
    const mesa = await mesaService.pedirCuenta(req.params.codigo)
    const io = req.app.get('io')
    if (io) {
      io.to('role:mozo').to('role:admin').emit('alertaMesa', {
        mesa,
        tipo: 'PEDIR_CUENTA',
        mensaje: `${mesa.codigo} pide la cuenta al mozo`
      })
      io.to('role:mozo').to('role:admin').emit('mesaActualizada', mesa)
      io.to(`mesa:${mesa.codigo}`).emit('mesaActualizada', mesa)
    }

    res.status(200).json({ message: 'Solicitud de cuenta enviada al mozo', mesa })
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}

exports.atenderMesa = async (req, res) => {
  try {
    const mesa = await mesaService.atenderLlamado(req.params.codigo)
    const io = req.app.get('io')
    if (io) {
      io.to('role:mozo').to('role:admin').emit('mesaActualizada', mesa)
      io.to(`mesa:${mesa.codigo}`).emit('mesaActualizada', mesa)
    }
    res.status(200).json({ message: 'Llamado atendido', mesa })
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}
