const request = require('supertest');
const app = require('../../index');
const db = require('../../database/db');
const routes = require('../../routes/routeNames');
const HTTP_STATUS = require('../../constants/httpStatus');

describe('Forgot & Reset Password Feature Tests', () => {
  const testEmail = 'admin@example.com';
  let generatedToken = '';

  afterAll(async () => {
    // Reset password back to 'password' for future test runs
    const bcrypt = require('bcrypt');
    const defaultPassword = await bcrypt.hash('password', 10);
    await db('users').where({ email: testEmail }).update({ password: defaultPassword });
    await db('password_resets').where({ email: testEmail }).delete();
    await db.destroy();
  });

  describe(`POST ${routes.api.forgotPassword}`, () => {
    test('returns 422 when email is missing or empty', async () => {
      const res = await request(app)
        .post(routes.api.forgotPassword)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('email');
    });

    test('returns 422 when email format is invalid', async () => {
      const res = await request(app)
        .post(routes.api.forgotPassword)
        .send({ email: 'not-an-email' });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('email');
    });

    test('returns 404 when user email does not exist', async () => {
      const res = await request(app)
        .post(routes.api.forgotPassword)
        .send({ email: 'nonexistent_user_999@example.com' });

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('could not find a user');
    });

    test('returns 200, creates password_resets record with user_id, and sends email', async () => {
      const res = await request(app)
        .post(routes.api.forgotPassword)
        .send({ email: testEmail });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('Password reset link');

      // Verify token record in database
      const resetRecord = await db('password_resets').where({ email: testEmail }).first();
      expect(resetRecord).toBeDefined();
      expect(resetRecord.user_id).toBeDefined();
      expect(resetRecord.token).toBeDefined();
      expect(resetRecord.token.length).toBeGreaterThan(10);

      generatedToken = resetRecord.token;
    });
  });

  describe(`GET ${routes.api.verifyResetToken}`, () => {
    test('returns 422 when token or email query parameters are missing', async () => {
      const res = await request(app)
        .get(routes.api.verifyResetToken)
        .query({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('token');
      expect(res.body.errors).toHaveProperty('email');
    });

    test('returns 400 when token is invalid or does not match email', async () => {
      const res = await request(app)
        .get(routes.api.verifyResetToken)
        .query({
          token: 'invalid_token_123',
          email: testEmail
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });

    test('returns 200 when token and email are valid and unexpired', async () => {
      const res = await request(app)
        .get(routes.api.verifyResetToken)
        .query({
          token: generatedToken,
          email: testEmail
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password reset token is valid.');
      expect(res.body.token).toBe(generatedToken);
      expect(res.body.email).toBe(testEmail);
    });
  });

  describe(`POST ${routes.api.resetPassword}`, () => {
    test('returns 422 when required fields are missing', async () => {
      const res = await request(app)
        .post(routes.api.resetPassword)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('email');
      expect(res.body.errors).toHaveProperty('token');
      expect(res.body.errors).toHaveProperty('password');
      expect(res.body.errors).toHaveProperty('password_confirmation');
    });

    test('returns 422 when password confirmation does not match', async () => {
      const res = await request(app)
        .post(routes.api.resetPassword)
        .send({
          email: testEmail,
          token: generatedToken,
          password: 'new_secret_password_123',
          password_confirmation: 'mismatched_password'
        });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('password_confirmation');
    });

    test('returns 400 when token is invalid during reset attempt', async () => {
      const res = await request(app)
        .post(routes.api.resetPassword)
        .send({
          email: testEmail,
          token: 'expired_or_fake_token',
          password: 'new_secret_password_123',
          password_confirmation: 'new_secret_password_123'
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid or expired');
    });

    test('returns 200, updates password, deletes token, and allows login with new credentials', async () => {
      const newPassword = 'new_secret_password_123';

      const res = await request(app)
        .post(routes.api.resetPassword)
        .send({
          email: testEmail,
          token: generatedToken,
          password: newPassword,
          password_confirmation: newPassword
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Password has been successfully reset.');

      // Verify token was deleted from password_resets
      const resetRecord = await db('password_resets').where({ email: testEmail }).first();
      expect(resetRecord).toBeUndefined();

      // Verify that user can login with the new password
      const loginRes = await request(app)
        .post(routes.api.login)
        .send({
          email: testEmail,
          password: newPassword
        });

      expect(loginRes.status).toBe(HTTP_STATUS.OK);
      expect(loginRes.body.success).toBe(true);
      expect(loginRes.body).toHaveProperty('token');
    });
  });
});
