import test from 'node:test'
import assert from 'node:assert/strict'
import supertest from 'supertest'

process.env.NODE_ENV = 'test'

const serverModule = await import('../justice-server/server.js')
const app = serverModule.default || serverModule

test('auth endpoints are rate limited after 5 requests per minute', async () => {
  const agent = supertest.agent(app)

  for (let i = 0; i < 5; i++) {
    const res = await agent
      .post('/api/login')
      .set('content-type', 'application/json')
      .send({ username: 'admin', password: 'adminpass' })
    assert.equal(res.statusCode, 200, `attempt ${i + 1} should succeed`)
  }

  const limited = await agent
    .post('/api/login')
    .set('content-type', 'application/json')
    .send({ username: 'admin', password: 'adminpass' })

  assert.equal(limited.statusCode, 429, '6th attempt should be rate limited')
  assert.equal(limited.body?.error, 'Too many auth requests, please try again later.')
  assert.ok(limited.headers['retry-after'], 'retry-after header should be present')
})
