const request = require('supertest');
const app = require('../server'); // Adjust path if needed

describe('GET /api/health', () => {
  it('should return status 200 and healthy message', async () => {
    const res = await request(app).get('/api/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
