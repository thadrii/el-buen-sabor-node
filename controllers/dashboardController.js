const Pedido = require('../models/pedidoModel')
const Mesa = require('../models/mesaModel')
const Plato = require('../models/platoModel')
const ResenaService = require('../services/resenaService')

const resenaService = new ResenaService()

exports.getResumen = async (req, res) => {
  try {
    const [pedidos, mesas, platos, resenasInfo] = await Promise.all([
      Pedido.find(),
      Mesa.find(),
      Plato.find(),
      resenaService.getResumen()
    ])

    const pagados = pedidos.filter((p) => p.estado === 'PAGADO')
    const ingresosTotales = Number(pagados.reduce((acc, p) => acc + (p.total || 0), 0).toFixed(2))
    const enCocina = pedidos.filter((p) => p.estado === 'CREADO' || p.estado === 'EN_COCINA').length
    const listos = pedidos.filter((p) => p.estado === 'LISTO').length
    const mesasOcupadas = mesas.filter((m) => m.estado !== 'LIBRE').length

    const conTiempoPrep = pedidos.filter((p) => p.readyAt && p.createdAt)
    const tiempoPromedioMin = conTiempoPrep.length > 0
      ? Number(
          (
            conTiempoPrep.reduce((acc, p) => acc + (p.readyAt - p.createdAt) / 60000, 0) /
            conTiempoPrep.length
          ).toFixed(1)
        )
      : 0

    const conteoPlatos = {}
    for (const p of pedidos) {
      if (p.estado === 'CANCELADO') continue
      for (const it of p.items || []) {
        conteoPlatos[it.nombre] = (conteoPlatos[it.nombre] || 0) + (it.cantidad || 1)
      }
    }
    const topPlatos = Object.entries(conteoPlatos)
      .map(([nombre, cantidad]) => ({ nombre, cantidad }))
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)

    res.status(200).json({
      kpis: {
        totalPedidos: pedidos.length,
        pedidosPagados: pagados.length,
        ingresosTotales,
        enCocina,
        listos,
        mesasOcupadas,
        totalMesas: mesas.length,
        totalPlatos: platos.filter((p) => p.activo).length,
        tiempoPromedioMin,
        calificacionPromedio: resenasInfo.promedio,
        totalResenas: resenasInfo.total
      },
      topPlatos,
      ultimasResenas: resenasInfo.resenas.slice(0, 6),
      ultimosPedidos: pedidos.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10)
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
