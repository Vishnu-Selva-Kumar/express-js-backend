const path = require('path');
const fs = require('fs');
const Attachment = require('#models/Attachment');
const db = require('#database/db');
const { ATTACHABLE_TYPE, ATTACHMENT_FOR } = require('#constants/attachment');

describe('Attachment Model Unit Tests', () => {
  const testAttachableType = ATTACHABLE_TYPE.USER;
  const testAttachableId = 1;
  const testAttachmentFor = ATTACHMENT_FOR.USER.PROFILE;
  let createdAttachmentId = null;
  const dummyFilePath = 'storage/app/profiles/unit_test_sample.png';
  const dummyAbsoluteFilePath = path.resolve(process.cwd(), dummyFilePath);

  beforeAll(async () => {
    // Ensure test dummy file exists on disk
    const dir = path.dirname(dummyAbsoluteFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(dummyAbsoluteFilePath, 'test content');
  });

  afterAll(async () => {
    // Cleanup any remaining test files & DB records
    if (fs.existsSync(dummyAbsoluteFilePath)) {
      fs.unlinkSync(dummyAbsoluteFilePath);
    }
    await db('attachments').where({ attachable_type: testAttachableType, attachable_id: testAttachableId }).del();
    await db.destroy();
  });

  test('Attachment.create() stores attachment record in MySQL', async () => {
    const attachment = await Attachment.create({
      attachable_type: testAttachableType,
      attachable_id: testAttachableId,
      attachment_for: testAttachmentFor,
      file_name: 'avatar.png',
      file_path: dummyFilePath,
      file_type: 'image/png',
      file_size: 1024
    });

    expect(attachment).toBeDefined();
    expect(attachment.id).toBeDefined();
    expect(attachment.attachable_type).toBe(testAttachableType);
    expect(attachment.attachable_id).toBe(testAttachableId);
    expect(attachment.attachment_for).toBe(testAttachmentFor);
    expect(attachment.file_name).toBe('avatar.png');
    expect(attachment.file_path).toBe(dummyFilePath);
    expect(attachment.file_type).toBe('image/png');
    expect(Number(attachment.file_size)).toBe(1024);

    createdAttachmentId = attachment.id;
  });

  test('Attachment.findById() returns attachment by primary key', async () => {
    const attachment = await Attachment.findById(createdAttachmentId);
    expect(attachment).toBeDefined();
    expect(attachment.id).toBe(createdAttachmentId);
  });

  test('Attachment.findByAttachable() retrieves all attachments for entity', async () => {
    const list = await Attachment.findByAttachable(testAttachableType, testAttachableId, testAttachmentFor);
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThanOrEqual(1);
    expect(list[0].id).toBe(createdAttachmentId);
  });

  test('Attachment.findLatest() retrieves newest attachment for entity', async () => {
    const latest = await Attachment.findLatest(testAttachableType, testAttachableId, testAttachmentFor);
    expect(latest).toBeDefined();
    expect(latest.id).toBe(createdAttachmentId);
  });

  test('Attachment.formatWithUrl() appends valid media url', () => {
    const mockAttachment = {
      id: 42,
      file_path: 'storage/app/profiles/42.png'
    };

    const formatted = Attachment.formatWithUrl(mockAttachment, 'http://localhost:3000');
    expect(formatted.url).toBe('http://localhost:3000/media/42/storage/app/profiles/42.png');
    expect(formatted.full_url).toBe('http://localhost:3000/media/42/storage/app/profiles/42.png');

    // Test with Express req object
    const mockReq = {
      protocol: 'https',
      get: (header) => (header.toLowerCase() === 'host' ? 'api.example.com' : null)
    };
    const formattedWithReq = Attachment.formatWithUrl(mockAttachment, mockReq);
    expect(formattedWithReq.url).toBe('https://api.example.com/media/42/storage/app/profiles/42.png');
  });

  test('Attachment.deleteById() unlinks file and removes database record', async () => {
    expect(fs.existsSync(dummyAbsoluteFilePath)).toBe(true);

    const deleted = await Attachment.deleteById(createdAttachmentId, true);
    expect(deleted).toBe(1);

    const checkDb = await Attachment.findById(createdAttachmentId);
    expect(checkDb).toBeUndefined();

    expect(fs.existsSync(dummyAbsoluteFilePath)).toBe(false);
  });
});
