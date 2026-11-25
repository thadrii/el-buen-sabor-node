const Plato = require('../models/platoModel')

const REGLAS = [
  { keywords: ['hambre', 'lleno', 'llenador', 'contundente', 'fuerte', 'grande', 'abundante'], tag: 'abundante', peso: 4 },
  { keywords: ['paciencia', 'rapido', 'rápido', 'apuro', 'al toque', 'pronto', 'esperar'], tag: 'rapido', peso: 4 },
  { keywords: ['ligero', 'suave', 'liviano', 'fresco', 'dieta', 'ensalada'], tag: 'ligero', peso: 4 },
  { keywords: ['compartir', 'grupo', 'amigos', 'picar', 'piqueo'], tag: 'compartir', peso: 4 },
  { keywords: ['bebida', 'tomar', 'sed', 'frio', 'frío', 'refrescante', 'jugo', 'chicha', 'gaseosa'], tag: 'bebida', peso: 5 },
  { keywords: ['postre', 'dulce', 'antojo', 'torta', 'flan', 'suspiro'], tag: 'postre', peso: 5 },
  { keywords: ['entrada', 'empezar', 'antes'], tag: 'entrada', peso: 4 },
  { keywords: ['carne', 'res', 'milanesa', 'lomo', 'parrilla'], tag: 'carne', peso: 4 },
  { keywords: ['pescado', 'marino', 'ceviche', 'limon', 'limón'], tag: 'pescado', peso: 4 },
  { keywords: ['economico', 'económico', 'barato', 'oferta'], tag: 'economico', peso: 4 },
  { keywords: ['tradicional', 'peruano', 'clasico', 'clásico', 'tipico', 'típico', 'casa'], tag: 'tradicional', peso: 3 }
]

class AsistenteService {
  async recomendar(consulta = '') {
    const texto = typeof consulta === 'string' ? consulta.trim().toLowerCase() : ''
    const platos = await Plato.find({ activo: true })

    if (!texto) {
      const top = platos
        .filter((p) => p.categoria === 'Platos' || p.etiquetas.includes('favorito'))
        .slice(0, 3)
      return {
        mensaje: 'Te recomiendo los favoritos de la casa que salen rápido de cocina:',
        recomendaciones: top
      }
    }

    const tagsBuscados = []
    for (const regla of REGLAS) {
      if (regla.keywords.some((k) => texto.includes(k))) {
        tagsBuscados.push({ tag: regla.tag, peso: regla.peso })
      }
    }

    const pideRapido = texto.includes('paciencia') || texto.includes('rapido') || texto.includes('rápido') || texto.includes('apuro')

    const scored = platos.map((plato) => {
      let score = 0
      const tags = Array.isArray(plato.etiquetas) ? plato.etiquetas : []
      const hay = `${plato.nombre} ${plato.descripcion} ${plato.categoria}`.toLowerCase()

      for (const { tag, peso } of tagsBuscados) {
        if (tags.includes(tag) || hay.includes(tag)) {
          score += peso
        }
      }

      if (pideRapido) {
        score += Math.max(0, 16 - (plato.tiempoPrepMin || 10)) * 0.4
      }

      if (texto.includes('economico') || texto.includes('barato')) {
        score += Math.max(0, 35 - plato.precio) * 0.2
      }

      if (plato.nombre.toLowerCase().split(' ').some((w) => w.length > 3 && texto.includes(w))) {
        score += 6
      }

      if (tags.includes('favorito')) score += 1
      return { plato, score }
    })

    scored.sort((a, b) => b.score - a.score || a.plato.tiempoPrepMin - b.plato.tiempoPrepMin)

    const top = scored.slice(0, 3).map((x) => x.plato)
    const mensaje = pideRapido
      ? 'Para calmar el hambre sin esperar de más, estas opciones salen directo y rápido:'
      : tagsBuscados.length > 0
        ? 'Según lo que buscas hoy, estas son mis mejores recomendaciones de la carta:'
        : 'Estas opciones combinan muy bien con lo que nos cuentas:'

    return {
      mensaje,
      recomendaciones: top
    }
  }
}

module.exports = AsistenteService
