const db = require('../database/db');
const Role = require('./Role');

class User {
  /**
   * Find a user by email (including password hash for authentication)
   * @param {string} email
   * @returns {Promise<Object|undefined>}
   */
  static async findByEmail(email) {
    return db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select('users.*', 'roles.name as role_name')
      .where('users.email', email)
      .whereNull('users.deleted_at')
      .first();
  }

  /**
   * Find a user by ID (excluding password for profile safety)
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async findById(id) {
    return db('users')
      .leftJoin('roles', 'users.role_id', 'roles.id')
      .select(
        'users.id',
        'users.role_id',
        'roles.name as role_name',
        'users.name',
        'users.email',
        'users.phone',
        'users.email_verified_at',
        'users.phone_verified_at',
        'users.created_at',
        'users.updated_at'
      )
      .where('users.id', id)
      .whereNull('users.deleted_at')
      .first();
  }

  /**
   * Update user profile attributes by ID
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|undefined>}
   */
  static async update(id, data) {
    const allowedFields = ['name', 'phone'];
    const updatePayload = {};

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updatePayload[field] = data[field];
      }
    }

    if (Object.keys(updatePayload).length > 0) {
      updatePayload.updated_at = db.fn.now();
      await db('users').where({ id }).update(updatePayload);
    }

    return User.findById(id);
  }

  /**
   * Create a new user record
   * @param {Object} data
   * @param {number} [data.role_id=2] Default regular user
   * @param {string} data.name
   * @param {string} data.email
   * @param {string} [data.phone]
   * @param {string} data.password - Hashed password
   * @param {Date|null} [data.email_verified_at]
   * @param {Date|null} [data.phone_verified_at]
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [id] = await db('users').insert({
      role_id: data.role_id || Role.ROLE_USER,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      password: data.password,
      email_verified_at: data.email_verified_at || null,
      phone_verified_at: data.phone_verified_at || null,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    return User.findById(id);
  }

  /**
   * Update user password by ID
   * @param {number} id
   * @param {string} hashedPassword
   * @returns {Promise<Object|undefined>}
   */
  static async updatePassword(id, hashedPassword) {
    await db('users')
      .where({ id })
      .update({
        password: hashedPassword,
        updated_at: db.fn.now()
      });

    return User.findById(id);
  }

  /**
   * Mark user's email as verified
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async markEmailAsVerified(id) {
    await db('users')
      .where({ id })
      .update({
        email_verified_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    return User.findById(id);
  }

  /**
   * Mark user's phone as verified
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async markPhoneAsVerified(id) {
    await db('users')
      .where({ id })
      .update({
        phone_verified_at: db.fn.now(),
        updated_at: db.fn.now()
      });

    return User.findById(id);
  }
}

module.exports = User;
