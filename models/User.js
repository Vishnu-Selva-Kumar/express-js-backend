const db = require('../database/db');

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
}

module.exports = User;
