const express = require('express')
const router = express.Router()
const asistenteController = require('../controllers/asistenteController')

router.post('/recomendar', asistenteController.recomendar)

module.exports = router
