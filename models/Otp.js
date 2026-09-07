const db = require('../database/db');

class Otp {
  /**
   * Create a new OTP record for a user
   * @param {Object} params
   * @param {number} params.user_id
   * @param {string} params.otp
   * @param {number} [params.expiresInMinutes=10]
   * @returns {Promise<Object>}
   */
  static async create({ user_id, otp, expiresInMinutes = 10 }) {
    // Delete any pending OTPs for this user
    await db('otps').where({ user_id }).delete();

    const expiredAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    const [id] = await db('otps').insert({
      user_id,
      otp: String(otp),
      expired_at: expiredAt,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    return db('otps').where({ id }).first();
  }

  /**
   * Find an active, valid, and unexpired OTP for a user
   * @param {Object} params
   * @param {number} params.user_id
   * @param {string} params.otp
   * @returns {Promise<Object|undefined>}
   */
  static async findValid({ user_id, otp }) {
    return db('otps')
      .where({ user_id, otp: String(otp) })
      .where('expired_at', '>', db.fn.now())
      .first();
  }

  /**
   * Verify and consume (delete) the OTP
   * @param {Object} params
   * @param {number} params.user_id
   * @param {string} params.otp
   * @returns {Promise<boolean>}
   */
  static async verify({ user_id, otp }) {
    const record = await Otp.findValid({ user_id, otp });
    if (!record) return false;

    // Delete once consumed
    await db('otps').where({ id: record.id }).delete();
    return true;
  }

  /**
   * Delete OTPs for a user
   * @param {number} userId
   * @returns {Promise<number>}
   */
  static async deleteByUserId(userId) {
    return db('otps').where({ user_id: userId }).delete();
  }

  /**
   * Delete expired OTPs
   * @returns {Promise<number>}
   */
  static async deleteExpired() {
    return db('otps').where('expired_at', '<=', db.fn.now()).delete();
  }
}

module.exports = Otp;
