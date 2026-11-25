const express = require('express')
const router = express.Router()
const resenaController = require('../controllers/resenaController')

router.get('/', resenaController.getResenas)
router.post('/', resenaController.createResena)

module.exports = router
