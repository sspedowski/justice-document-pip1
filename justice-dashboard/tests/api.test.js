// API integration test using supertest and Jest
const request = require('supertest');

const app = require('../../justice-server/server');

describe('API Authentication', () => {
  it('should reject login with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'wrong', password: 'wrong' });
    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('should allow login with correct admin credentials', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'adminpass' });
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body.user).toMatchObject({ username: 'admin', role: 'admin' });
  });
});
