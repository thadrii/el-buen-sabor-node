const express = require('express')
const router = express.Router()
const pedidoController = require('../controllers/pedidoController')
const { verifyToken, requireRoles } = require('../middlewares/verifyToken')

router.get('/', verifyToken, requireRoles('admin', 'cocinero', 'mozo'), pedidoController.getAllPedidos)
router.get('/cocina', verifyToken, requireRoles('cocinero', 'admin'), pedidoController.getPedidosCocina)
router.get('/mozo', verifyToken, requireRoles('mozo', 'admin'), pedidoController.getPedidosMozo)
router.get('/mesa/:codigo', pedidoController.getPedidoPorMesa)
router.post('/', pedidoController.createPedido)
router.patch('/:id/estado', verifyToken, requireRoles('cocinero', 'mozo', 'admin'), pedidoController.actualizarEstado)
router.post('/:id/pagar', pedidoController.pagarPedido)

module.exports = router
