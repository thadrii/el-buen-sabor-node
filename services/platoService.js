const Plato = require('../models/platoModel')

const CATEGORIAS_VALIDAS = ['Entradas', 'Platos', 'Bebidas', 'Postres']

class PlatoService {
  async getAll() {
    return Plato.find()
  }

  async getActivos() {
    return Plato.find({ activo: true })
  }

  async getById(id) {
    return Plato.findById(id)
  }

  async create(data) {
    const nombre = typeof data.nombre === 'string' ? data.nombre.trim() : ''
    const descripcion = typeof data.descripcion === 'string' ? data.descripcion.trim() : ''
    const categoria = CATEGORIAS_VALIDAS.includes(data.categoria) ? data.categoria : 'Platos'
    const precio = Number(data.precio)
    const tiempoPrepMin = Math.max(1, Number(data.tiempoPrepMin) || 10)
    const etiquetas = Array.isArray(data.etiquetas)
      ? data.etiquetas.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
      : []
    const icono = typeof data.icono === 'string' && data.icono.trim() ? data.icono.trim() : '🍽️'

    if (!nombre || !Number.isFinite(precio) || precio <= 0) {
      throw new Error('Nombre y precio válido (> 0) son obligatorios')
    }

    return Plato.create({
      nombre,
      descripcion,
      categoria,
      precio: Number(precio.toFixed(2)),
      tiempoPrepMin,
      etiquetas,
      icono,
      activo: data.activo !== undefined ? Boolean(data.activo) : true
    })
  }

  async update(id, data) {
    const current = await Plato.findById(id)
    if (!current) {
      throw new Error('Plato no encontrado')
    }

    const patch = {}
    if (typeof data.nombre === 'string' && data.nombre.trim()) patch.nombre = data.nombre.trim()
    if (typeof data.descripcion === 'string') patch.descripcion = data.descripcion.trim()
    if (CATEGORIAS_VALIDAS.includes(data.categoria)) patch.categoria = data.categoria
    if (data.precio !== undefined) {
      const precio = Number(data.precio)
      if (!Number.isFinite(precio) || precio <= 0) {
        throw new Error('El precio debe ser mayor a 0')
      }
      patch.precio = Number(precio.toFixed(2))
    }
    if (data.tiempoPrepMin !== undefined) {
      patch.tiempoPrepMin = Math.max(1, Number(data.tiempoPrepMin) || 10)
    }
    if (Array.isArray(data.etiquetas)) {
      patch.etiquetas = data.etiquetas.map((t) => String(t).trim().toLowerCase()).filter(Boolean)
    }
    if (typeof data.icono === 'string' && data.icono.trim()) patch.icono = data.icono.trim()
    if (data.activo !== undefined) patch.activo = Boolean(data.activo)

    return Plato.updateById(id, patch)
  }

  async remove(id) {
    const deleted = await Plato.deleteById(id)
    if (!deleted) {
      throw new Error('Plato no encontrado')
    }
    return deleted
  }
}

module.exports = PlatoService
