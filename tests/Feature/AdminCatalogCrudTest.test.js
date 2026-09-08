const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('#app');
const db = require('#database/db');
const routes = require('#routes/routeNames');
const HTTP_STATUS = require('#constants/httpStatus');
const User = require('#models/User');
const Token = require('#models/Token');
const Role = require('#models/Role');

describe('Admin Catalog CRUD Feature Tests', () => {
  let adminToken = '';
  let userToken = '';

  beforeAll(async () => {
    // 1. Authenticate or create Admin Token
    const adminLoginRes = await request(app)
      .post(routes.api.login)
      .send({
        email: 'admin@example.com',
        password: 'password'
      });

    if (adminLoginRes.status === HTTP_STATUS.OK) {
      adminToken = adminLoginRes.body.token;
    } else {
      // Fallback create admin
      const adminUser = await User.findByEmail('admin@example.com');
      const token = jwt.sign(
        { id: adminUser.id, email: adminUser.email, role_id: Role.ROLE_ADMINISTRATOR, jti: `${Date.now()}-adm` },
        process.env.JWT_SECRET || 'super_secret_jwt_key_here'
      );
      await Token.create({ user_id: adminUser.id, token, name: 'auth_token' });
      adminToken = token;
    }

    // 2. Create Regular User and Token for Authorization testing
    let regularUser = await User.findByEmail('regular-catalog-test@example.com');
    if (!regularUser) {
      regularUser = await User.create({
        role_id: Role.ROLE_USER,
        name: 'Regular Customer',
        email: 'regular-catalog-test@example.com',
        password: 'hashedpassword123'
      });
    }

    const regularJwt = jwt.sign(
      { id: regularUser.id, email: regularUser.email, role_id: Role.ROLE_USER, jti: `${Date.now()}-reg` },
      process.env.JWT_SECRET || 'super_secret_jwt_key_here'
    );
    await Token.create({ user_id: regularUser.id, token: regularJwt, name: 'auth_token' });
    userToken = regularJwt;
  });

  afterAll(async () => {
    await db('users').where({ email: 'regular-catalog-test@example.com' }).delete();
    await db.destroy();
  });

  describe('Security & Access Control', () => {
    test('rejects unauthenticated requests with 401 Unauthorized', async () => {
      const res = await request(app).get(routes.api.admin.categories);
      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });

    test('rejects non-admin users with 403 Forbidden', async () => {
      const res = await request(app)
        .get(routes.api.admin.categories)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(HTTP_STATUS.FORBIDDEN);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Forbidden: Admin access required.');
    });
  });

  describe('Categories CRUD', () => {
    let createdCategoryId = null;
    const testCategoryName = `Sci-Fi & Cyberpunk ${Date.now()}`;

    test('validates required fields on create (returns 422)', async () => {
      const res = await request(app)
        .post(routes.api.admin.categories)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('name');
    });

    test('creates a new category (returns 201)', async () => {
      const res = await request(app)
        .post(routes.api.admin.categories)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: testCategoryName,
          status: 1
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(testCategoryName);
      expect(res.body.data.status).toBe(1);

      createdCategoryId = res.body.data.id;
    });

    test('prevents duplicate category names (returns 422)', async () => {
      const res = await request(app)
        .post(routes.api.admin.categories)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: testCategoryName
        });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.name).toBe('A category with this name already exists.');
    });

    test('lists categories (returns 200)', async () => {
      const res = await request(app)
        .get(routes.api.admin.categories)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.some(c => c.id === createdCategoryId)).toBe(true);
    });

    test('shows category details by ID (returns 200)', async () => {
      const res = await request(app)
        .get(routes.adminCategoryUrl(createdCategoryId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdCategoryId);
      expect(Array.isArray(res.body.data.sub_categories)).toBe(true);
    });

    test('returns 404 for non-existent category', async () => {
      const res = await request(app)
        .get(routes.adminCategoryUrl(999999))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
    });

    test('updates a category (returns 200)', async () => {
      const updatedName = `${testCategoryName} Updated`;
      const res = await request(app)
        .put(routes.adminCategoryUrl(createdCategoryId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: updatedName,
          status: 0
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe(updatedName);
      expect(res.body.data.status).toBe(0);
    });

    test('deletes a category (returns 200)', async () => {
      const res = await request(app)
        .delete(routes.adminCategoryUrl(createdCategoryId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get(routes.adminCategoryUrl(createdCategoryId))
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('Subcategories CRUD', () => {
    let parentCategoryId = null;
    let createdSubCategoryId = null;

    beforeAll(async () => {
      const cat = await request(app)
        .post(routes.api.admin.categories)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: `SubCategory Parent ${Date.now()}` });
      parentCategoryId = cat.body.data.id;
    });

    afterAll(async () => {
      if (parentCategoryId) {
        await request(app)
          .delete(routes.adminCategoryUrl(parentCategoryId))
          .set('Authorization', `Bearer ${adminToken}`);
      }
    });

    test('validates required fields on create (returns 422)', async () => {
      const res = await request(app)
        .post(routes.api.admin.subCategories)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('name');
    });

    test('validates invalid category_id on create (returns 422)', async () => {
      const res = await request(app)
        .post(routes.api.admin.subCategories)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Dystopian',
          category_id: 999999
        });

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors.category_id).toBe('The selected category does not exist.');
    });

    test('creates a new subcategory linked to parent category (returns 201)', async () => {
      const res = await request(app)
        .post(routes.api.admin.subCategories)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Space Opera',
          category_id: parentCategoryId,
          status: 1
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Space Opera');
      expect(res.body.data.category_id).toBe(parentCategoryId);

      createdSubCategoryId = res.body.data.id;
    });

    test('lists subcategories (returns 200)', async () => {
      const res = await request(app)
        .get(routes.api.admin.subCategories)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('shows subcategory details by ID (returns 200)', async () => {
      const res = await request(app)
        .get(routes.adminSubCategoryUrl(createdSubCategoryId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdSubCategoryId);
      expect(res.body.data.name).toBe('Space Opera');
    });

    test('updates a subcategory (returns 200)', async () => {
      const res = await request(app)
        .put(routes.adminSubCategoryUrl(createdSubCategoryId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Hard Science Fiction',
          status: 0
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Hard Science Fiction');
      expect(res.body.data.status).toBe(0);
    });

    test('deletes a subcategory (returns 200)', async () => {
      const res = await request(app)
        .delete(routes.adminSubCategoryUrl(createdSubCategoryId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);

      const checkRes = await request(app)
        .get(routes.adminSubCategoryUrl(createdSubCategoryId))
        .set('Authorization', `Bearer ${adminToken}`);
      expect(checkRes.status).toBe(HTTP_STATUS.NOT_FOUND);
    });
  });

  describe('Authors CRUD', () => {
    let createdAuthorId = null;

    test('validates required fields on create (returns 422)', async () => {
      const res = await request(app)
        .post(routes.api.admin.authors)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.errors).toHaveProperty('name');
    });

    test('creates author (returns 201)', async () => {
      const res = await request(app)
        .post(routes.api.admin.authors)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Isaac Asimov',
          status: 1
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.data.name).toBe('Isaac Asimov');
      createdAuthorId = res.body.data.id;
    });

    test('lists authors (returns 200)', async () => {
      const res = await request(app)
        .get(routes.api.admin.authors)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('shows author details (returns 200)', async () => {
      const res = await request(app)
        .get(routes.adminAuthorUrl(createdAuthorId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.id).toBe(createdAuthorId);
    });

    test('updates author (returns 200)', async () => {
      const res = await request(app)
        .put(routes.adminAuthorUrl(createdAuthorId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Isaac Asimov (Updated)'
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.name).toBe('Isaac Asimov (Updated)');
    });

    test('deletes author (returns 200)', async () => {
      const res = await request(app)
        .delete(routes.adminAuthorUrl(createdAuthorId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe('Publishers CRUD', () => {
    let createdPublisherId = null;

    test('validates required fields on create (returns 422)', async () => {
      const res = await request(app)
        .post(routes.api.admin.publishers)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.errors).toHaveProperty('name');
    });

    test('creates publisher (returns 201)', async () => {
      const res = await request(app)
        .post(routes.api.admin.publishers)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tor Books',
          status: 1
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.data.name).toBe('Tor Books');
      createdPublisherId = res.body.data.id;
    });

    test('lists publishers (returns 200)', async () => {
      const res = await request(app)
        .get(routes.api.admin.publishers)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('shows publisher details (returns 200)', async () => {
      const res = await request(app)
        .get(routes.adminPublisherUrl(createdPublisherId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.id).toBe(createdPublisherId);
    });

    test('updates publisher (returns 200)', async () => {
      const res = await request(app)
        .put(routes.adminPublisherUrl(createdPublisherId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tor Books Publishing'
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.name).toBe('Tor Books Publishing');
    });

    test('deletes publisher (returns 200)', async () => {
      const res = await request(app)
        .delete(routes.adminPublisherUrl(createdPublisherId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
    });
  });

  describe('Languages CRUD', () => {
    let createdLanguageId = null;

    test('validates required fields on create (returns 422)', async () => {
      const res = await request(app)
        .post(routes.api.admin.languages)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.errors).toHaveProperty('name');
    });

    test('creates language (returns 201)', async () => {
      const res = await request(app)
        .post(routes.api.admin.languages)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Italian',
          status: 1
        });

      expect(res.status).toBe(HTTP_STATUS.CREATED);
      expect(res.body.data.name).toBe('Italian');
      createdLanguageId = res.body.data.id;
    });

    test('lists languages (returns 200)', async () => {
      const res = await request(app)
        .get(routes.api.admin.languages)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('shows language details (returns 200)', async () => {
      const res = await request(app)
        .get(routes.adminLanguageUrl(createdLanguageId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.id).toBe(createdLanguageId);
    });

    test('updates language (returns 200)', async () => {
      const res = await request(app)
        .put(routes.adminLanguageUrl(createdLanguageId))
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Italian (Standard)'
        });

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.data.name).toBe('Italian (Standard)');
    });

    test('deletes language (returns 200)', async () => {
      const res = await request(app)
        .delete(routes.adminLanguageUrl(createdLanguageId))
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
    });
  });
});
