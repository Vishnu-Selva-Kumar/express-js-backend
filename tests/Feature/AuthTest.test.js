const request = require('supertest');
const app = require('../../index');
const db = require('../../database/db');
const routes = require('../../routes/routeNames');
const HTTP_STATUS = require('../../constants/httpStatus');

describe('Authentication API Feature Tests', () => {
  let authToken = '';

  afterAll(async () => {
    await db.destroy();
  });

  describe(`POST ${routes.api.login}`, () => {
    test('returns 200 and JWT token with valid credentials', async () => {
      const res = await request(app)
        .post(routes.api.login)
        .send({
          email: 'admin@example.com',
          password: 'password'
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('admin@example.com');
      expect(res.body.user.role_name).toBe('Administrator');

      authToken = res.body.token;
    });

    test('returns 401 when password is incorrect', async () => {
      const res = await request(app)
        .post(routes.api.login)
        .send({
          email: 'admin@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Invalid email or password.');
    });

    test('returns 422 validation error when required fields are missing', async () => {
      const res = await request(app)
        .post(routes.api.login)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('email');
      expect(res.body.errors).toHaveProperty('password');
    });
  });

  describe(`GET ${routes.api.profile}`, () => {
    test('returns 200 and profile when authenticated with Bearer token', async () => {
      const res = await request(app)
        .get(routes.api.profile)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe('admin@example.com');
      expect(res.body.user.password).toBeUndefined();
    });

    test('returns 401 when no authorization token is provided', async () => {
      const res = await request(app).get(routes.api.profile);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized');
    });

    test('returns 401 when an invalid token is provided', async () => {
      const res = await request(app)
        .get(routes.api.profile)
        .set('Authorization', 'Bearer invalid.token.here');

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized');
    });
  });

  describe(`DELETE ${routes.api.logout}`, () => {
    test('returns 200 and logs out successfully, removing token from database', async () => {
      // Verify token exists in database before logout
      const beforeLogout = await db('tokens').where({ token: authToken }).first();
      expect(beforeLogout).toBeDefined();

      const res = await request(app)
        .delete(routes.api.logout)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Successfully logged out.');

      // Verify token is removed from database
      const afterLogout = await db('tokens').where({ token: authToken }).first();
      expect(afterLogout).toBeUndefined();
    });

    test('rejects subsequent requests using the revoked token', async () => {
      const res = await request(app)
        .get(routes.api.profile)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Unauthorized: Invalid or revoked token');
    });
  });
});
