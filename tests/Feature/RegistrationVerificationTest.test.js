const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('#app');
const db = require('#database/db');
const routes = require('#routes/routeNames');
const HTTP_STATUS = require('#constants/httpStatus');
const Otp = require('#models/Otp');

describe('Registration & Verification Feature Tests', () => {
  const newUserEmail = 'newuser_test@example.com';
  let createdUserId = null;
  let validVerificationToken = null;

  afterAll(async () => {
    if (createdUserId) {
      await db('otps').where({ user_id: createdUserId }).delete();
      await db('users').where({ id: createdUserId }).delete();
    }
    await db('users').where({ email: newUserEmail }).delete();
    await db.destroy();
  });

  describe(`POST ${routes.api.register}`, () => {
    test('returns 422 when required fields are missing', async () => {
      const res = await request(app)
        .post(routes.api.register)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.errors).toHaveProperty('name');
      expect(res.body.errors).toHaveProperty('email');
      expect(res.body.errors).toHaveProperty('password');
      expect(res.body.errors).toHaveProperty('password_confirmation');
    });

    test('returns 409 when email already exists', async () => {
      const res = await request(app)
        .post(routes.api.register)
        .send({
          name: 'Existing Admin',
          email: 'admin@example.com',
          password: 'password123',
          password_confirmation: 'password123'
        });

      expect(res.status).toBe(HTTP_STATUS.CONFLICT);
      expect(res.body.message).toContain('already been taken');
    });

    test('returns 201 on successful registration and dispatches welcome email', async () => {
      const res = await request(app)
        .post(routes.api.register)
        .send({
          name: 'New Registered User',
          email: newUserEmail,
          phone: '+1234567890',
          password: 'secret_password_123',
          password_confirmation: 'secret_password_123'
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.message).toContain('Registration successful');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe(newUserEmail);

      createdUserId = res.body.user.id;

      // Generate a test verification token for the created user
      validVerificationToken = jwt.sign(
        { id: createdUserId, email: newUserEmail, type: 'email_verification' },
        process.env.JWT_SECRET || 'super_secret_jwt_key_here',
        { expiresIn: '48h' }
      );
    });
  });

  describe(`GET ${routes.api.verifyEmail}`, () => {
    test('returns 422 when verification token is missing', async () => {
      const res = await request(app)
        .get(routes.api.verifyEmail)
        .query({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test('returns 400 when verification token is invalid', async () => {
      const res = await request(app)
        .get(routes.api.verifyEmail)
        .query({ token: 'invalid.token.signature' });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
    });

    test('returns 200 and marks email as verified when token is valid', async () => {
      const res = await request(app)
        .get(routes.api.verifyEmail)
        .query({ token: validVerificationToken });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.message).toBe('Email verified successfully.');

      // Check database
      const user = await db('users').where({ id: createdUserId }).first();
      expect(user.email_verified_at).not.toBeNull();
    });

    test('returns 200 stating email has already been verified on repeat attempt', async () => {
      const res = await request(app)
        .get(routes.api.verifyEmail)
        .query({ token: validVerificationToken });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.message).toBe('Email has already been verified.');
    });
  });

  describe(`POST ${routes.api.verifyPhone}`, () => {
    test('returns 422 when neither authenticated user nor email is provided', async () => {
      const res = await request(app)
        .post(routes.api.verifyPhone)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
    });

    test('returns 400 when OTP is invalid or not found in otps table', async () => {
      const res = await request(app)
        .post(routes.api.verifyPhone)
        .send({
          email: newUserEmail,
          otp: '999999'
        });

      expect(res.status).toBe(HTTP_STATUS.BAD_REQUEST);
      expect(res.body.message).toBe('Invalid or expired OTP.');
    });

    test('returns 200 and marks phone as verified when valid OTP is in otps table', async () => {
      // Seed valid OTP into otps table
      await Otp.create({
        user_id: createdUserId,
        otp: '123456',
        expiresInMinutes: 10
      });

      const res = await request(app)
        .post(routes.api.verifyPhone)
        .send({
          email: newUserEmail,
          otp: '123456'
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.message).toBe('Phone verified successfully.');

      // Check database
      const user = await db('users').where({ id: createdUserId }).first();
      expect(user.phone_verified_at).not.toBeNull();

      // Check OTP was consumed
      const otpInDb = await db('otps').where({ user_id: createdUserId, otp: '123456' }).first();
      expect(otpInDb).toBeUndefined();
    });
  });
});
