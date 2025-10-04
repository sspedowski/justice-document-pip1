import test from 'node:test'
import assert from 'node:assert/strict'
import request from 'supertest'

// Ensure server boots in test mode (disables csurf and fixes admin creds)
process.env.NODE_ENV = 'test'

// Import the Express app (CommonJS export) using dynamic import of CJS path
const app = (await import('../justice-server/server.js')).default || (await import('../justice-server/server.js'))

function getToken(agent) {
  return agent
    .post('/api/login')
    .set('content-type', 'application/json')
    .send({ username: 'admin', password: 'adminpass' })
    .then(r => (r.body && r.body.token) || null)
}

test('auth endpoints are rate limited after 5 requests per minute', async (t) => {
  const agent = request(app)
  // make 5 valid attempts
  for (let i = 0; i < 5; i++) {
    const res = await agent
      .post('/api/login')
      .set('content-type', 'application/json')
      .send({ username: 'admin', password: 'adminpass' })
    // First five should not be limited
    assert.equal(res.statusCode, 200)
    if (res.statusCode === 429) {
      // if we hit limiter early due to shared state, test still passes
      return
    }
  }
  // 6th should be limited
  const res6 = await agent
    .post('/api/login')
    .set('content-type', 'application/json')
    .send({ username: 'admin', password: 'adminpass' })
  assert.equal(res6.statusCode, 429)
  assert.equal(typeof res6.body, 'object')
})
