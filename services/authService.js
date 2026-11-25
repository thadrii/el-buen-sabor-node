const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const UserAuth = require('../models/authModel')
const { jwtSecret } = require('../config')

class AuthService {
  async register({ nombre, email, password, rol = 'mozo' }) {
    const hashedPassword = await bcrypt.hash(password, 10)
    return UserAuth.create({
      nombre,
      email: email.toLowerCase(),
      password: hashedPassword,
      rol
    })
  }

  async filterByEmail(email) {
    if (typeof email !== 'string') return null
    return UserAuth.findOne({ email: email.trim().toLowerCase() })
  }

  async getAll() {
    const users = await UserAuth.find()
    return users.map(({ password, ...safe }) => safe)
  }

  generateToken(payload) {
    return jwt.sign(payload, jwtSecret, { expiresIn: '8h' })
  }

  async refreshToken(token) {
    const decoded = jwt.verify(token, jwtSecret)
    const user = await this.filterByEmail(decoded.email)
    if (!user) {
      throw new Error('Usuario no encontrado')
    }
    const payload = {
      id: user.id,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol
    }
    return this.generateToken(payload)
  }
}

module.exports = AuthService
