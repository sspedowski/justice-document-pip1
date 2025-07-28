// Backend API tests for file upload and document management

const request = require('supertest');
const path = require('path');
const fs = require('fs');

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

  describe('POST /api/upload', () => {
    it('should reject upload without authentication', async () => {
      const res = await request(app)
        .post('/api/upload')
        .attach('file', Buffer.from('fake pdf content'), 'test.pdf');
      
      expect(res.statusCode).toBe(401);
    });

    it('should accept PDF upload with valid authentication', async () => {
      // Create a simple test PDF buffer
      const testPdfPath = path.join(__dirname, '../cypress/fixtures/sample.pdf');
      
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', testPdfPath)
        .field('category', 'Legal Evidence')
        .field('tags', 'test,evidence');
      
      expect([200, 201]).toContain(res.statusCode);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('filename');
    });

    it('should reject non-PDF files', async () => {
      const res = await request(app)
        .post('/api/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('not a pdf'), 'test.txt');
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/documents', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .get('/api/documents');
      
      expect(res.statusCode).toBe(401);
    });

    it('should return document list for authenticated user', async () => {
      const res = await request(app)
        .get('/api/documents')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('documents');
      expect(Array.isArray(res.body.documents)).toBe(true);
    });
  });

  describe('POST /api/documents/:id/summarize', () => {
    it('should require authentication', async () => {
      const res = await request(app)
        .post('/api/documents/test-id/summarize');
      
      expect(res.statusCode).toBe(401);
    });

    it('should handle document summarization request', async () => {
      const res = await request(app)
        .post('/api/documents/test-id/summarize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ prompt: 'Summarize this legal document' });
      
      // Should either succeed or fail gracefully
      expect([200, 400, 404]).toContain(res.statusCode);
    });
  });
});
