const path = require('path')

module.exports = {
  db: {
    dataFile: process.env.DATA_FILE || path.join(__dirname, 'database', 'data.json')
  },
  jwtSecret: process.env.JWT_SECRET || 'secret-key-buen-sabor',
  port: process.env.PORT || 3000
}
