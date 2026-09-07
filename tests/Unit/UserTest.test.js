const User = require('#models/User');
const db = require('#database/db');

describe('User Model Unit Tests', () => {
  afterAll(async () => {
    await db.destroy();
  });

  test('findByEmail() retrieves correct user record and joins role_name', async () => {
    const user = await User.findByEmail('admin@example.com');
    expect(user).toBeDefined();
    expect(user.email).toBe('admin@example.com');
    expect(user.name).toBe('Admin User');
    expect(user.role_name).toBe('Administrator');
    expect(user.password).toBeDefined();
  });

  test('findById() retrieves user profile without exposing password', async () => {
    const user = await User.findById(1);
    expect(user).toBeDefined();
    expect(user.id).toBe(1);
    expect(user.email).toBe('admin@example.com');
    expect(user.role_name).toBe('Administrator');
    expect(user.password).toBeUndefined();
  });

  test('findByEmail() returns undefined for non-existent user', async () => {
    const user = await User.findByEmail('unknown@example.com');
    expect(user).toBeUndefined();
  });
});
