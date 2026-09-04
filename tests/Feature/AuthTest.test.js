const request = require('supertest');
const app = require('../../index');
const db = require('../../database/db');

describe('Authentication API Feature Tests', () => {
  let authToken = '';

  afterAll(async () => {
    await db.destroy();
  });

  describe('POST /api/login', () => {
    test('returns 200 and JWT token with valid credentials', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@example.com',
          password: 'password'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('admin@example.com');
      expect(res.body.user.role_name).toBe('Administrator');

      authToken = res.body.token;
    });

    test('returns 401 when password is incorrect', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    test('returns 422 validation error when required fields are missing', async () => {
      const res = await request(app)
        .post('/api/login')
        .send({});

      expect(res.status).toBe(422);
      expect(res.body.errors).toHaveProperty('email');
      expect(res.body.errors).toHaveProperty('password');
    });
  });

  describe('GET /api/profile', () => {
    test('returns 200 and profile when authenticated with Bearer token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('admin@example.com');
      expect(res.body.user.password).toBeUndefined();
    });

    test('returns 401 when no authorization token is provided', async () => {
      const res = await request(app).get('/api/profile');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });

    test('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(401);
      expect(res.body.message).toContain('Unauthorized');
    });
  });

  describe('DELETE /api/logout', () => {
    test('returns 200 and logs out successfully', async () => {
      const res = await request(app)
        .delete('/api/logout')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Successfully logged out.');
    });

    test('rejects subsequent requests using the invalidated token', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized: Token has been revoked');
    });
  });
});
