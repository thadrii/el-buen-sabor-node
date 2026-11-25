const Resena = require('../models/resenaModel')

class ResenaService {
  async getAll() {
    const resenas = await Resena.find()
    return resenas.sort((a, b) => b.createdAt - a.createdAt)
  }

  async create({ pedidoId = null, mesaCodigo, estrellas, comentario = '' }) {
    const rating = Number(estrellas)
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      throw new Error('La calificación debe ser entre 1 y 5 estrellas')
    }
    const codigo = typeof mesaCodigo === 'string' && mesaCodigo.trim()
      ? mesaCodigo.trim().toUpperCase()
      : 'MESA-01'

    return Resena.create({
      pedidoId,
      mesaCodigo: codigo,
      estrellas: rating,
      comentario: typeof comentario === 'string' ? comentario.trim().slice(0, 300) : ''
    })
  }

  async getResumen() {
    const resenas = await this.getAll()
    const total = resenas.length
    const promedio = total > 0
      ? Number((resenas.reduce((acc, r) => acc + r.estrellas, 0) / total).toFixed(1))
      : 5.0
    return { total, promedio, resenas }
  }
}

module.exports = ResenaService
