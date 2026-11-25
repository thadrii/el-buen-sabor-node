const jwt = require('jsonwebtoken')
const { jwtSecret } = require('./config')
const Mesa = require('./models/mesaModel')

module.exports = (io) => {
  io.use(async (socket, next) => {
    const auth = socket.handshake.auth || {}
    const token = auth.token
    const tableCode = typeof auth.tableCode === 'string' ? auth.tableCode.trim().toUpperCase() : ''

    if (token) {
      try {
        socket.user = jwt.verify(token, jwtSecret)
        socket.clientType = 'staff'
        return next()
      } catch (err) {
        return next(new Error('No autorizado: token inválido o expirado'))
      }
    }

    if (tableCode) {
      const mesa = await Mesa.findOne({ codigo: tableCode })
      if (!mesa) {
        return next(new Error('Mesa no válida'))
      }
      socket.tableCode = mesa.codigo
      socket.clientType = 'mesa'
      return next()
    }

    return next(new Error('No autorizado: se requiere token o código de mesa'))
  })

  io.on('connection', (socket) => {
    if (socket.clientType === 'staff' && socket.user) {
      const rol = socket.user.rol
      socket.join(`role:${rol}`)
      if (rol === 'admin') {
        socket.join('role:cocinero')
        socket.join('role:mozo')
      }
      console.log(`Personal conectado [${rol}]: ${socket.user.email}`)
    } else if (socket.clientType === 'mesa' && socket.tableCode) {
      socket.join(`mesa:${socket.tableCode}`)
      console.log(`Cliente conectado en ${socket.tableCode}`)
    }

    socket.on('disconnect', () => {
      if (socket.clientType === 'staff' && socket.user) {
        console.log(`Personal desconectado: ${socket.user.email}`)
      }
    })
  })
}
