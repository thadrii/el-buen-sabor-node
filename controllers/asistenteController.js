const AsistenteService = require('../services/asistenteService')

const asistenteService = new AsistenteService()

exports.recomendar = async (req, res) => {
  try {
    const consulta = typeof req.body?.consulta === 'string' ? req.body.consulta : ''
    const resultado = await asistenteService.recomendar(consulta)
    res.status(200).json(resultado)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
