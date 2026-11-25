const express = require('express')
const router = express.Router()
const platoController = require('../controllers/platoController')
const { verifyToken, requireAdmin } = require('../middlewares/verifyToken')

router.get('/', platoController.getAllPlatos)
router.post('/', verifyToken, requireAdmin, platoController.createPlato)
router.put('/:id', verifyToken, requireAdmin, platoController.updatePlato)
router.delete('/:id', verifyToken, requireAdmin, platoController.deletePlato)

module.exports = router
