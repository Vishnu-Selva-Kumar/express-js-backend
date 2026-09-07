const db = require('#database/db');

class Token {
  /**
   * Create and store a new token record
   * @param {Object} data
   * @param {number} data.user_id
   * @param {string} data.token
   * @param {string} [data.name='auth_token']
   * @param {Date|null} [data.expires_at=null]
   * @returns {Promise<Object>}
   */
  static async create({ user_id, token, name = 'auth_token', expires_at = null }) {
    const [id] = await db('tokens').insert({
      user_id,
      token,
      name,
      expires_at
    });

    return db('tokens').where({ id }).first();
  }

  /**
   * Find an active, valid token in the database
   * @param {string} token
   * @returns {Promise<Object|undefined>}
   */
  static async findValidToken(token) {
    return db('tokens')
      .where({ token })
      .andWhere((builder) => {
        builder.whereNull('expires_at').orWhere('expires_at', '>', db.fn.now());
      })
      .first();
  }

  /**
   * Revoke (delete) a specific token on logout
   * @param {string} token
   * @returns {Promise<number>}
   */
  static async revoke(token) {
    return db('tokens').where({ token }).del();
  }

  /**
   * Revoke all tokens for a given user
   * @param {number} userId
   * @returns {Promise<number>}
   */
  static async revokeAllForUser(userId) {
    return db('tokens').where({ user_id: userId }).del();
  }
}

module.exports = Token;
