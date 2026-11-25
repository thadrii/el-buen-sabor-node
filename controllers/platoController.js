const PlatoService = require('../services/platoService')

const platoService = new PlatoService()

exports.getAllPlatos = async (req, res) => {
  try {
    const includeAll = req.query.all === '1'
    const platos = includeAll ? await platoService.getAll() : await platoService.getActivos()
    res.status(200).json(platos)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createPlato = async (req, res) => {
  try {
    const plato = await platoService.create(req.body)
    const io = req.app.get('io')
    if (io) {
      io.emit('cartaActualizada', await platoService.getActivos())
    }
    res.status(201).json({ message: 'Plato creado correctamente', plato })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.updatePlato = async (req, res) => {
  try {
    const plato = await platoService.update(req.params.id, req.body)
    const io = req.app.get('io')
    if (io) {
      io.emit('cartaActualizada', await platoService.getActivos())
    }
    res.status(200).json({ message: 'Plato actualizado correctamente', plato })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}

exports.deletePlato = async (req, res) => {
  try {
    await platoService.remove(req.params.id)
    const io = req.app.get('io')
    if (io) {
      io.emit('cartaActualizada', await platoService.getActivos())
    }
    res.status(200).json({ message: 'Plato eliminado correctamente' })
  } catch (error) {
    res.status(404).json({ message: error.message })
  }
}
