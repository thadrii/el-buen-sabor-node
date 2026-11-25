const bcrypt = require('bcrypt')
const AuthService = require('../services/authService')

const authService = new AuthService()
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

exports.register = async (req, res) => {
  try {
    const { nombre, email, password } = req.body
    if (typeof nombre !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Datos de registro inválidos' })
    }
    if (!nombre.trim() || !EMAIL_REGEX.test(email.trim()) || password.length < 5) {
      return res.status(400).json({
        message: 'Nombre, correo válido y contraseña (mínimo 5 caracteres) son obligatorios'
      })
    }
    const existing = await authService.filterByEmail(email)
    if (existing) {
      return res.status(400).json({ message: 'El correo ya está registrado' })
    }
    // Por seguridad, todo registro público inicia con rol estándar ('mozo')
    await authService.register({ nombre: nombre.trim(), email: email.trim(), password, rol: 'mozo' })
    res.status(201).json({ message: 'Usuario registrado correctamente' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
      return res.status(400).json({ message: 'Correo y contraseña requeridos' })
    }
    const userAuth = await authService.filterByEmail(email)
    if (!userAuth) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }
    const passwordMatch = await bcrypt.compare(password, userAuth.password)
    if (!passwordMatch) {
      return res.status(401).json({ message: 'Credenciales inválidas' })
    }
    const payload = {
      id: userAuth.id,
      email: userAuth.email,
      nombre: userAuth.nombre,
      rol: userAuth.rol
    }
    const token = authService.generateToken(payload)
    res.status(200).json({ token, user: payload })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

exports.refresh = async (req, res) => {
  try {
    const { token } = req.body
    if (typeof token !== 'string' || !token) {
      return res.status(400).json({ message: 'Token requerido' })
    }
    const newToken = await authService.refreshToken(token)
    res.status(200).json({ token: newToken })
  } catch (error) {
    res.status(401).json({ error: error.message })
  }
}

exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await authService.getAll()
    res.status(200).json(usuarios)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
