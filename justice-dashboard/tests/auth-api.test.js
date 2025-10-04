 
// @ts-nocheck
// Backend API tests for authentication endpoints

const path = require('path');
const request = require('supertest');

// Import your server app
const app = require('../../justice-server/server');

describe('Authentication API', () => {
  describe('POST /api/login', () => {
    it('should reject login with missing credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({});
      
      expect(res.statusCode).toBe(400);
      expect(res.body).toHaveProperty('error');
      expect(res.body.error).toContain('Username and password required');
    });

    it('should reject login with invalid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ 
          username: 'invalid', 
          password: 'wrongpassword' 
        });
      
      expect(res.statusCode).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should accept login with valid admin credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ 
          username: 'admin', 
          password: 'adminpass' 
        });
      
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toMatchObject({ 
        username: 'admin', 
        role: 'admin' 
      });
    });

    it('should return a valid JWT token', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({ 
          username: 'admin', 
          password: 'adminpass' 
        });
      
      expect(res.body.token).toBeDefined();
      expect(res.body.token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('POST /api/logout', () => {
    it('should handle logout request', async () => {
      // First login to get token
      const loginRes = await request(app)
        .post('/api/login')
        .send({ username: 'admin', password: 'adminpass' });
      
      const token = loginRes.body.token;
      
      // Then logout
      const res = await request(app)
        .post('/api/logout')
        .set('Authorization', `Bearer ${token}`);
      
      expect([200, 201]).toContain(res.statusCode);
    });
  });
});
