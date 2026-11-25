const bcrypt = require('bcrypt')
const UserAuth = require('./models/authModel')
const Mesa = require('./models/mesaModel')
const Plato = require('./models/platoModel')
const { load } = require('./database/store')

async function ensureSeedUsers() {
  const defaultPassword = await bcrypt.hash('12345', 10)
  const usuarios = [
    { nombre: 'Administrador', email: 'admin@buensabor.pe', rol: 'admin' },
    { nombre: 'Chef Carlos', email: 'cocina@buensabor.pe', rol: 'cocinero' },
    { nombre: 'Mozo Mateo', email: 'mozo@buensabor.pe', rol: 'mozo' }
  ]

  for (const u of usuarios) {
    const exists = await UserAuth.findOne({ email: u.email })
    if (!exists) {
      await UserAuth.create({
        nombre: u.nombre,
        email: u.email,
        password: defaultPassword,
        rol: u.rol
      })
    }
  }
}

async function ensureSeedMesas() {
  if ((await Mesa.countDocuments()) > 0) return

  const mesas = []
  for (let i = 1; i <= 12; i++) {
    const num = String(i).padStart(2, '0')
    mesas.push({
      codigo: `MESA-${num}`,
      numero: i,
      piso: i <= 6 ? 1 : 2,
      capacidad: i % 3 === 0 ? 6 : 4,
      estado: 'LIBRE',
      pedidoActivoId: null,
      llamandoMozo: false
    })
  }
  await Mesa.insertMany(mesas)
}

async function ensureSeedPlatos() {
  if ((await Plato.countDocuments()) > 0) return

  await Plato.insertMany([
    {
      nombre: 'Causa Limeña',
      descripcion: 'Papa amarilla prensada con ají amarillo, pollo deshilachado y palta fresca.',
      categoria: 'Entradas',
      precio: 14.0,
      tiempoPrepMin: 8,
      etiquetas: ['rapido', 'ligero', 'frio', 'entrada', 'tradicional'],
      icono: '🥔',
      activo: true
    },
    {
      nombre: 'Anticuchos de Corazón',
      descripcion: 'Dos brochetas a la parrilla con papa dorada, choclo y salsa de ají.',
      categoria: 'Entradas',
      precio: 18.0,
      tiempoPrepMin: 12,
      etiquetas: ['compartir', 'entrada', 'parrilla', 'tradicional'],
      icono: '🍢',
      activo: true
    },
    {
      nombre: 'Tequeños de Queso',
      descripcion: 'Seis crujientes tequeños rellenos de queso andino acompañados de guacamole.',
      categoria: 'Entradas',
      precio: 13.0,
      tiempoPrepMin: 7,
      etiquetas: ['rapido', 'compartir', 'entrada', 'economico'],
      icono: '🧀',
      activo: true
    },
    {
      nombre: 'Lomo Saltado',
      descripcion: 'Trozos de res flambeados al wok con cebolla, tomate, papas fritas y arroz.',
      categoria: 'Platos',
      precio: 29.0,
      tiempoPrepMin: 15,
      etiquetas: ['abundante', 'carne', 'tradicional', 'favorito'],
      icono: '🥩',
      activo: true
    },
    {
      nombre: 'Ceviche Clásico',
      descripcion: 'Pesca del día marinada en limón sutil, cebolla roja, camote glaseado y cancha.',
      categoria: 'Platos',
      precio: 32.0,
      tiempoPrepMin: 10,
      etiquetas: ['rapido', 'ligero', 'frio', 'pescado', 'tradicional'],
      icono: '🐟',
      activo: true
    },
    {
      nombre: 'Milanesa Napolitana',
      descripcion: 'Milanesa crocante cubierta con salsa de tomate, mozzarella gratinada y papas fritas.',
      categoria: 'Platos',
      precio: 27.0,
      tiempoPrepMin: 14,
      etiquetas: ['abundante', 'carne', 'favorito'],
      icono: '🍽️',
      activo: true
    },
    {
      nombre: 'Ají de Gallina',
      descripcion: 'Pechuga deshilachada en crema de ají amarillo, nueces, papa sancochada y arroz.',
      categoria: 'Platos',
      precio: 24.0,
      tiempoPrepMin: 11,
      etiquetas: ['rapido', 'tradicional', 'economico'],
      icono: '🍛',
      activo: true
    },
    {
      nombre: 'Arroz con Pollo',
      descripcion: 'Arroz verde al culantro con presa dorada, papa a la huancaína y salsa criolla.',
      categoria: 'Platos',
      precio: 25.0,
      tiempoPrepMin: 12,
      etiquetas: ['abundante', 'tradicional'],
      icono: '🍗',
      activo: true
    },
    {
      nombre: 'Chicha Morada (500ml)',
      descripcion: 'Maíz morado hervido con piña, canela, clavo de olor y limón fresco.',
      categoria: 'Bebidas',
      precio: 7.0,
      tiempoPrepMin: 2,
      etiquetas: ['rapido', 'frio', 'bebida', 'sed', 'tradicional'],
      icono: '🫐',
      activo: true
    },
    {
      nombre: 'Inca Kola 500ml',
      descripcion: 'Bebida gaseosa helada en botella personal.',
      categoria: 'Bebidas',
      precio: 6.5,
      tiempoPrepMin: 1,
      etiquetas: ['rapido', 'frio', 'bebida', 'sed'],
      icono: '🥤',
      activo: true
    },
    {
      nombre: 'Suspiro a la Limeña',
      descripcion: 'Manjar blanco tradicional coronado con merengue al oporto y canela.',
      categoria: 'Postres',
      precio: 12.0,
      tiempoPrepMin: 3,
      etiquetas: ['rapido', 'dulce', 'postre', 'tradicional'],
      icono: '🍮',
      activo: true
    },
    {
      nombre: 'Flan Casero con Caramelo',
      descripcion: 'Porción de flan artesanal con caramelo suave y crema batida.',
      categoria: 'Postres',
      precio: 11.0,
      tiempoPrepMin: 3,
      etiquetas: ['rapido', 'dulce', 'postre', 'ligero'],
      icono: '🍯',
      activo: true
    }
  ])
}

async function runSeed({ forceCatalogIfEmpty = true } = {}) {
  load()
  await ensureSeedUsers()
  if (!forceCatalogIfEmpty) return
  await ensureSeedMesas()
  await ensureSeedPlatos()
}

async function autoSeedIfEmpty() {
  const totalUsers = await UserAuth.countDocuments()
  if (totalUsers === 0) {
    await runSeed({ forceCatalogIfEmpty: true })
    console.log('Datos iniciales cargados automáticamente en El Buen Sabor')
  }
}

if (require.main === module) {
  runSeed({ forceCatalogIfEmpty: true })
    .then(() => {
      console.log('Seed ejecutado correctamente (admin@buensabor.pe, cocina@buensabor.pe, mozo@buensabor.pe / clave: 12345)')
    })
    .catch((err) => {
      console.error('Error al ejecutar seed:', err.message)
      process.exit(1)
    })
}

module.exports = { runSeed, autoSeedIfEmpty }
