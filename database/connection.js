const { load } = require('./store')
const { autoSeedIfEmpty } = require('../seed')

async function initDatabase() {
  load()
  await autoSeedIfEmpty()
  console.log('Base de datos JSON inicializada correctamente')
}

module.exports = initDatabase()
