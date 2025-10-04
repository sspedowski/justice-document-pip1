// Backend API tests for file upload and document management

const _fs = require('fs');
const path = require('path');
const request = require('supertest');

const app = require('../../justice-server/server');

describe('Document Management API', () => {
  let authToken;
  
  beforeAll(async () => {
    // Login to get auth token for protected routes
    const loginRes = await request(app)
      .post('/api/login')
      .send({ username: 'admin', password: 'adminpass' });
    
    authToken = loginRes.body.token;
  });

  describe('POST /api/summarize', () => {
    it('should reject upload without authentication', async () => {
      const res = await request(app)
        .post('/api/summarize')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf');
      expect(res.statusCode).toBe(401);
    });

    it('should accept PDF upload with valid authentication', async () => {
      const testPdfPath = path.join(__dirname, '../cypress/fixtures/sample.pdf');
      const res = await request(app)
        .post('/api/summarize')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testPdfPath);
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('fileURL');
    });

    it('should reject non-PDF files', async () => {
      const res = await request(app)
        .post('/api/summarize')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('not a pdf'), 'test.txt');
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });
});
