const Token = require('#models/Token');
const db = require('#database/db');

describe('Token Model Unit Tests', () => {
  const testToken = 'unit_test_jwt_token_sample';
  const testUserId = 1;

  afterAll(async () => {
    await db('tokens').where({ token: testToken }).del();
    await db.destroy();
  });

  test('Token.create() stores token in database with user_id', async () => {
    const record = await Token.create({
      user_id: testUserId,
      token: testToken,
      name: 'test_token'
    });

    expect(record).toBeDefined();
    expect(record.user_id).toBe(testUserId);
    expect(record.token).toBe(testToken);
    expect(record.name).toBe('test_token');
  });

  test('Token.findValidToken() retrieves existing active token', async () => {
    const record = await Token.findValidToken(testToken);
    expect(record).toBeDefined();
    expect(record.token).toBe(testToken);
    expect(record.user_id).toBe(testUserId);
  });

  test('Token.findValidToken() returns undefined for non-existent token', async () => {
    const record = await Token.findValidToken('non_existent_token');
    expect(record).toBeUndefined();
  });

  test('Token.revoke() removes token from database', async () => {
    const deletedCount = await Token.revoke(testToken);
    expect(deletedCount).toBe(1);

    const check = await Token.findValidToken(testToken);
    expect(check).toBeUndefined();
  });
});
