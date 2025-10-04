import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

process.env.NODE_ENV = 'test'

const mod = await import('../justice-server/server.js')
const app = mod.default || mod

// This test checks unauthorized path: missing bearer token should 401
// (Server implementation uses Authorization header, not a cookie.)

test('refresh-token returns 401 when no token provided', async () => {
  const res = await request(app).post('/api/refresh-token')
  assert.equal(res.status, 401)
  const body = typeof res.body === 'object' ? JSON.stringify(res.body) : String(res.text || '')
  assert.match(body, /missing|invalid|unauthorized/i)
})
