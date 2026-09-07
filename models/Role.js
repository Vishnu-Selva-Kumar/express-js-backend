const db = require('#database/db');

class Role {
  static ROLE_ADMINISTRATOR = 1;
  static ROLE_USER = 2;

  static ROLES = Object.freeze({
    ADMINISTRATOR: 1,
    USER: 2
  });

  /**
   * Find a role by ID
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async findById(id) {
    return db('roles').where({ id }).first();
  }

  /**
   * Find a role by name
   * @param {string} name
   * @returns {Promise<Object|undefined>}
   */
  static async findByName(name) {
    return db('roles').where({ name }).first();
  }

  /**
   * Retrieve all roles
   * @returns {Promise<Array>}
   */
  static async all() {
    return db('roles').select('*');
  }
}

module.exports = Role;
