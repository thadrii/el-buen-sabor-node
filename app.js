const express = require('express')
const path = require('path')
const http = require('http')
const socketIo = require('socket.io')
const { port } = require('./config')

const dbReady = require('./database/connection')

const authRouter = require('./routers/authRouter')
const mesaRouter = require('./routers/mesaRouter')
const platoRouter = require('./routers/platoRouter')
const pedidoRouter = require('./routers/pedidoRouter')
const resenaRouter = require('./routers/resenaRouter')
const asistenteRouter = require('./routers/asistenteRouter')
const dashboardRouter = require('./routers/dashboardRouter')
const MesaService = require('./services/mesaService')

const mesaService = new MesaService()

const app = express()
app.disable('x-powered-by')
const server = http.createServer(app)
const io = socketIo(server)
require('./socket')(io)

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  next()
})

app.set('io', io)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Vistas web EJS
app.get('/', (req, res) => {
  res.render('index')
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/mesa/:codigo', async (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase()
  const mesa = await mesaService.getByCodigo(codigo)
  if (!mesa) {
    return res.status(404).render('index', { errorMesa: `La mesa ${codigo} no existe` })
  }
  res.render('mesa', { mesaCodigo: mesa.codigo, mesa })
})

app.get('/cocina', (req, res) => {
  res.render('cocina')
})

app.get('/mozo', (req, res) => {
  res.render('mozo')
})

app.get('/dashboard', (req, res) => {
  res.render('dashboard')
})

// Endpoints API REST
app.use('/auth', authRouter)
app.use('/api/mesas', mesaRouter)
app.use('/api/platos', platoRouter)
app.use('/api/pedidos', pedidoRouter)
app.use('/api/resenas', resenaRouter)
app.use('/api/asistente', asistenteRouter)
app.use('/api/dashboard', dashboardRouter)

if (require.main === module) {
  dbReady.then(() => {
    server.listen(port, () => {
      console.log(`El Buen Sabor ejecutándose en http://localhost:${port}`)
    })
  })
}

module.exports = { app, server, io, dbReady }
