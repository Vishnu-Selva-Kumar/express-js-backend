const path = require('path');
const fs = require('fs');
const request = require('supertest');
const app = require('#app');
const db = require('#database/db');
const routes = require('#routes/routeNames');
const Attachment = require('#models/Attachment');
const HTTP_STATUS = require('#constants/httpStatus');
const { ATTACHABLE_TYPE, ATTACHMENT_FOR } = require('#constants/attachment');

describe('Profile Attachment & Media Feature Tests', () => {
  let authToken = '';
  let uploadedAttachmentId = null;
  let uploadedFilePath = '';

  beforeAll(async () => {
    // Authenticate admin user
    const loginRes = await request(app)
      .post(routes.api.login)
      .send({
        email: 'admin@example.com',
        password: 'password'
      });
    authToken = loginRes.body.token;
  });

  afterAll(async () => {
    // Clean up created attachments and files
    await Attachment.deleteByAttachable(ATTACHABLE_TYPE.USER, 1, ATTACHMENT_FOR.USER.PROFILE, true);
    // Reset admin user name to original seed value
    await db('users').where({ id: 1 }).update({ name: 'Admin User' });
    // Clean up test token
    if (authToken) {
      await db('tokens').where({ token: authToken }).del();
    }
    await db.destroy();
  });

  describe(`PUT ${routes.api.profile} with file attachment`, () => {
    test('updates profile and uploads avatar successfully', async () => {
      // Create a small mock PNG buffer
      const pngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
        0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52,
        0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
        0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89
      ]);

      const res = await request(app)
        .put(routes.api.profile)
        .set('Authorization', `Bearer ${authToken}`)
        .field('name', 'Admin Updated')
        .attach('attachment', pngBuffer, 'avatar.png');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.user.name).toBe('Admin Updated');
      expect(res.body.user.attachment).toBeDefined();
      expect(res.body.user.attachment.file_name).toBe('avatar.png');
      expect(res.body.user.attachment.attachment_for).toBe(ATTACHMENT_FOR.USER.PROFILE);
      expect(res.body.user.attachment.url).toContain('/media/');

      uploadedAttachmentId = res.body.user.attachment.id;
      uploadedFilePath = res.body.user.attachment.file_path;

      // Verify physical existence in storage/app/profiles/
      const absolutePath = path.resolve(process.cwd(), uploadedFilePath);
      expect(fs.existsSync(absolutePath)).toBe(true);

      // Verify database record
      const dbRecord = await Attachment.findById(uploadedAttachmentId);
      expect(dbRecord).toBeDefined();
      expect(dbRecord.attachable_type).toBe(ATTACHABLE_TYPE.USER);
      expect(dbRecord.attachable_id).toBe(1);
    });

    test(`GET ${routes.api.profile} returns updated profile with attachment and media full url`, async () => {
      const res = await request(app)
        .get(routes.api.profile)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.success).toBe(true);
      expect(res.body.user.attachment).toBeDefined();
      expect(res.body.user.attachment.url).toContain(
        routes.mediaUrl(uploadedAttachmentId, uploadedFilePath)
      );
      expect(res.body.user.attachment.full_url).toContain(
        routes.mediaUrl(uploadedAttachmentId, uploadedFilePath)
      );
    });

    test('replaces previous avatar and unlinks old file upon new upload', async () => {
      const oldDiskPath = path.resolve(process.cwd(), uploadedFilePath);
      expect(fs.existsSync(oldDiskPath)).toBe(true);

      const secondPngBuffer = Buffer.from([
        0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
      ]);

      const res = await request(app)
        .put(routes.api.profile)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('attachment', secondPngBuffer, 'new_avatar.png');

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.body.user.attachment.file_name).toBe('new_avatar.png');

      // Verify old file was unlinked
      expect(fs.existsSync(oldDiskPath)).toBe(false);

      // Update references for remaining tests
      uploadedAttachmentId = res.body.user.attachment.id;
      uploadedFilePath = res.body.user.attachment.file_path;
    });

    test('rejects invalid file MIME type with 422 error', async () => {
      const textBuffer = Buffer.from('plain text content');

      const res = await request(app)
        .put(routes.api.profile)
        .set('Authorization', `Bearer ${authToken}`)
        .attach('attachment', textBuffer, 'malicious.txt');

      expect(res.status).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toHaveProperty('attachment');
    });

    test('rejects unauthorized request with 401 error', async () => {
      const res = await request(app)
        .put(routes.api.profile)
        .send({ name: 'Hacker' });

      expect(res.status).toBe(HTTP_STATUS.UNAUTHORIZED);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /media/:id/:path', () => {
    test('publicly serves avatar attachment file without authentication', async () => {
      const mediaUrl = routes.mediaUrl(uploadedAttachmentId, uploadedFilePath);

      const res = await request(app).get(mediaUrl);

      expect(res.status).toBe(HTTP_STATUS.OK);
      expect(res.headers['content-type']).toContain('image');
    });

    test('returns 404 when requested path does not match database record', async () => {
      const mismatchUrl = routes.mediaUrl(uploadedAttachmentId, 'storage/app/profiles/wrong-name.png');

      const res = await request(app).get(mismatchUrl);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Attachment not found.');
    });

    test('returns 404 when attachment ID does not exist', async () => {
      const notFoundUrl = routes.mediaUrl(999999, 'storage/app/profiles/test.png');

      const res = await request(app).get(notFoundUrl);

      expect(res.status).toBe(HTTP_STATUS.NOT_FOUND);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toBe('Attachment not found.');
    });
  });
});
