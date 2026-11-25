const ResenaService = require('../services/resenaService')

const resenaService = new ResenaService()

exports.getResenas = async (req, res) => {
  try {
    const resumen = await resenaService.getResumen()
    res.status(200).json(resumen)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.createResena = async (req, res) => {
  try {
    const resena = await resenaService.create({
      pedidoId: req.body.pedidoId,
      mesaCodigo: req.body.mesaCodigo,
      estrellas: req.body.estrellas,
      comentario: req.body.comentario
    })
    const resumen = await resenaService.getResumen()

    const io = req.app.get('io')
    if (io) {
      io.to('role:admin').emit('resenaNueva', { resena, resumen })
    }

    res.status(201).json({ message: '¡Gracias por tu calificación!', resena, resumen })
  } catch (error) {
    res.status(400).json({ message: error.message })
  }
}
