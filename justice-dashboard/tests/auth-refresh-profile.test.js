// @ts-nocheck
// Tests for /api/profile and /api/refresh-token

const request = require('supertest');
const app = require('../../justice-server/server');

describe('Auth refresh and profile endpoints', () => {
  let token;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'adminpass' });

    token = res.body.token;
  });

  test('GET /api/profile returns user info for valid token', async () => {
    const res = await request(app)
      .get('/api/profile')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({ username: 'admin', role: 'admin' });
  });

  test('POST /api/refresh-token returns a new token with valid bearer token', async () => {
    const res = await request(app)
      .post('/api/refresh-token')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.token.split('.')).toHaveLength(3);
  });

  test('GET /api/profile rejects missing token', async () => {
    const res = await request(app)
      .get('/api/profile');

    expect(res.statusCode).toBe(401);
  });
});
