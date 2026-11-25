const express = require('express')
const router = express.Router()
const dashboardController = require('../controllers/dashboardController')
const { verifyToken, requireAdmin } = require('../middlewares/verifyToken')

router.get('/', verifyToken, requireAdmin, dashboardController.getResumen)

module.exports = router
