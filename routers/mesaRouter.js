const express = require('express')
const router = express.Router()
const mesaController = require('../controllers/mesaController')
const { verifyToken, requireRoles } = require('../middlewares/verifyToken')

router.get('/', mesaController.getAllMesas)
router.get('/:codigo', mesaController.getMesa)
router.post('/:codigo/llamar-mozo', mesaController.llamarMozo)
router.post('/:codigo/pedir-cuenta', mesaController.pedirCuenta)
router.patch('/:codigo/atender', verifyToken, requireRoles('mozo', 'admin'), mesaController.atenderMesa)

module.exports = router
