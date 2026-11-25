const express = require('express')
const router = express.Router()
const authController = require('../controllers/authController')
const { verifyToken, requireAdmin } = require('../middlewares/verifyToken')

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/refresh', authController.refresh)
router.get('/usuarios', verifyToken, requireAdmin, authController.getUsuarios)

module.exports = router
