const jwt = require('jsonwebtoken')
const { jwtSecret } = require('../config')

exports.verifyToken = (req, res, next) => {
  const authorization = req.headers.authorization
  if (!authorization) {
    return res.status(401).json({ error: 'Token no enviado' })
  }
  try {
    const token = authorization.split(' ')[1]
    if (!token) {
      return res.status(401).json({ error: 'Token no enviado' })
    }
    req.user = jwt.verify(token, jwtSecret)
    next()
  } catch (error) {
    return res.status(401).json({ error: error.message })
  }
}

exports.requireRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({
      message: 'Acceso denegado: no tiene permisos suficientes para esta operación'
    })
  }
  next()
}

exports.requireAdmin = exports.requireRoles('admin')
