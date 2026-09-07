const request = require('supertest');
const app = require('#app');
const db = require('#database/db');
const routes = require('#routes/routeNames');
const HTTP_STATUS = require('#constants/httpStatus');

describe('Fallback 404 & 405 JSON Route Feature Tests', () => {
  afterAll(async () => {
    await db.destroy();
  });

  describe('404 Route Not Found in JSON format', () => {
    test('returns 404 JSON when visiting non-existent url /api/test-ulr', async () => {
      const res = await request(app).get('/api/test-ulr');

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'Route not found.'
      });
    });

    test('returns 404 JSON for unknown POST endpoint', async () => {
      const res = await request(app)
        .post('/api/unknown-endpoint')
        .send({ data: 'test' });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'Route not found.'
      });
    });
  });

  describe('405 Method Not Allowed in JSON format', () => {
    test('returns 405 JSON and Allow header when sending GET to login route', async () => {
      const res = await request(app).get(routes.api.login);

      expect(res.status).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.headers['allow']).toContain('POST');
      expect(res.body.message).toBe('Method not allowed.');
      expect(res.body.allowed_methods).toContain('POST');
    });

    test('returns 405 JSON and Allow header when sending DELETE to register route', async () => {
      const res = await request(app).delete(routes.api.register);

      expect(res.status).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.headers['allow']).toContain('POST');
      expect(res.body.message).toBe('Method not allowed.');
      expect(res.body.allowed_methods).toContain('POST');
    });

    test('returns 405 JSON when sending PUT to verifyEmail route', async () => {
      const res = await request(app).put(routes.api.verifyEmail);

      expect(res.status).toBe(HTTP_STATUS.METHOD_NOT_ALLOWED);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.headers['allow']).toContain('GET');
      expect(res.body.message).toBe('Method not allowed.');
      expect(res.body.allowed_methods).toContain('GET');
    });
  });

  describe('Global JSON error handling', () => {
    test('returns 400 JSON when body contains invalid JSON syntax', async () => {
      const res = await request(app)
        .post(routes.api.login)
        .set('Content-Type', 'application/json')
        .send('{"invalid_json": true,');

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toEqual({
        message: 'Invalid JSON payload.'
      });
    });
  });
});
