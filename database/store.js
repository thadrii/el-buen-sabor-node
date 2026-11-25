const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const { db } = require('../config')

const COLLECTIONS = ['usuarios', 'mesas', 'platos', 'pedidos', 'resenas']

function emptyState() {
  return {
    usuarios: [],
    mesas: [],
    platos: [],
    pedidos: [],
    resenas: []
  }
}

let cache = null

function ensureDir(filePath) {
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function load() {
  if (cache) return cache
  ensureDir(db.dataFile)
  if (!fs.existsSync(db.dataFile)) {
    cache = emptyState()
    save()
    return cache
  }
  const raw = fs.readFileSync(db.dataFile, 'utf8')
  const parsed = raw.trim() ? JSON.parse(raw) : {}
  cache = emptyState()
  for (const name of COLLECTIONS) {
    if (Array.isArray(parsed[name])) {
      cache[name] = parsed[name]
    }
  }
  return cache
}

function save() {
  if (!cache) cache = emptyState()
  ensureDir(db.dataFile)
  const tmpFile = `${db.dataFile}.${process.pid}.tmp`
  fs.writeFileSync(tmpFile, JSON.stringify(cache, null, 2), 'utf8')
  fs.renameSync(tmpFile, db.dataFile)
}

function getCollection(name) {
  const data = load()
  if (!Array.isArray(data[name])) {
    data[name] = []
  }
  return data[name]
}

function generateId() {
  return crypto.randomUUID()
}

function matchesFilter(doc, filter) {
  if (!filter || Object.keys(filter).length === 0) return true
  return Object.entries(filter).every(([key, value]) => doc[key] === value)
}

function createModel(collectionName) {
  return {
    async find(filter = {}) {
      return getCollection(collectionName)
        .filter((doc) => matchesFilter(doc, filter))
        .map((doc) => ({ ...doc }))
    },
    async findOne(filter = {}) {
      const found = getCollection(collectionName).find((doc) => matchesFilter(doc, filter))
      return found ? { ...found } : null
    },
    async findById(id) {
      const found = getCollection(collectionName).find((doc) => doc.id === id)
      return found ? { ...found } : null
    },
    async create(payload) {
      const col = getCollection(collectionName)
      const now = Date.now()
      const doc = {
        id: payload.id || generateId(),
        ...payload,
        createdAt: payload.createdAt || now
      }
      col.push(doc)
      save()
      return { ...doc }
    },
    async insertMany(items) {
      const col = getCollection(collectionName)
      const now = Date.now()
      const created = items.map((item) => ({
        id: item.id || generateId(),
        ...item,
        createdAt: item.createdAt || now
      }))
      col.push(...created)
      save()
      return created.map((doc) => ({ ...doc }))
    },
    async updateById(id, patch) {
      const col = getCollection(collectionName)
      const index = col.findIndex((doc) => doc.id === id)
      if (index === -1) return null
      col[index] = {
        ...col[index],
        ...patch,
        id: col[index].id
      }
      save()
      return { ...col[index] }
    },
    async deleteById(id) {
      const col = getCollection(collectionName)
      const index = col.findIndex((doc) => doc.id === id)
      if (index === -1) return null
      const [removed] = col.splice(index, 1)
      save()
      return { ...removed }
    },
    async countDocuments(filter = {}) {
      return getCollection(collectionName).filter((doc) => matchesFilter(doc, filter)).length
    }
  }
}

module.exports = {
  load,
  save,
  getCollection,
  generateId,
  createModel
}
