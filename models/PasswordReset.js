const db = require('#database/db');

class PasswordReset {
  /**
   * Create a new password reset token record, removing any previous tokens for the user/email
   * @param {Object} params
   * @param {number} params.user_id
   * @param {string} params.email
   * @param {string} params.token
   * @param {number} [params.expiresInMinutes=60]
   * @returns {Promise<Object>}
   */
  static async create({ user_id, email, token, expiresInMinutes = 60 }) {
    // Invalidate existing reset tokens for this user
    await db('password_resets')
      .where('email', email)
      .orWhere('user_id', user_id)
      .delete();

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const [id] = await db('password_resets').insert({
      user_id,
      email,
      token,
      created_at: db.fn.now(),
      expires_at: expiresAt
    });

    return db('password_resets').where({ id }).first();
  }

  /**
   * Find a valid, unexpired reset token by token and email
   * @param {string} token
   * @param {string} email
   * @returns {Promise<Object|undefined>}
   */
  static async findByTokenAndEmail(token, email) {
    return db('password_resets')
      .where('token', token)
      .where('email', email)
      .where('expires_at', '>', db.fn.now())
      .first();
  }

  /**
   * Find a valid, unexpired reset token by token alone
   * @param {string} token
   * @returns {Promise<Object|undefined>}
   */
  static async findByToken(token) {
    return db('password_resets')
      .where('token', token)
      .where('expires_at', '>', db.fn.now())
      .first();
  }

  /**
   * Delete reset token by email
   * @param {string} email
   * @returns {Promise<number>}
   */
  static async deleteByEmail(email) {
    return db('password_resets').where('email', email).delete();
  }

  /**
   * Delete reset token by user ID
   * @param {number} userId
   * @returns {Promise<number>}
   */
  static async deleteByUserId(userId) {
    return db('password_resets').where('user_id', userId).delete();
  }

  /**
   * Delete expired tokens
   * @returns {Promise<number>}
   */
  static async deleteExpired() {
    return db('password_resets').where('expires_at', '<=', db.fn.now()).delete();
  }
}

module.exports = PasswordReset;
