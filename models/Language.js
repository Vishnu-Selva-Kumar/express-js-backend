const db = require('#database/db');

class Language {
  static tableName = 'languages';

  /**
   * Retrieve all languages with optional search and status filtering
   * @param {Object} [filter]
   * @param {string} [filter.search]
   * @param {number|string} [filter.status]
   * @returns {Promise<Array>}
   */
  static async all(filter = {}) {
    let query = db(this.tableName).select('*').orderBy('id', 'asc');

    if (filter.search) {
      query = query.where('name', 'like', `%${filter.search}%`);
    }

    if (filter.status !== undefined && filter.status !== '') {
      query = query.where({ status: Number(filter.status) });
    }

    return query;
  }

  /**
   * Find a language by ID
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async findById(id) {
    return db(this.tableName).where({ id }).first();
  }

  /**
   * Find a language by name
   * @param {string} name
   * @param {number} [excludeId]
   * @returns {Promise<Object|undefined>}
   */
  static async findByName(name, excludeId = null) {
    let query = db(this.tableName).where({ name });
    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }
    return query.first();
  }

  /**
   * Create a new language
   * @param {Object} data
   * @param {string} data.name
   * @param {number} [data.status=1]
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [id] = await db(this.tableName).insert({
      name: data.name.trim(),
      status: data.status !== undefined ? Number(data.status) : 1,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    return this.findById(id);
  }

  /**
   * Update a language by ID
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|undefined>}
   */
  static async update(id, data) {
    const payload = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.status !== undefined) payload.status = Number(data.status);

    if (Object.keys(payload).length > 0) {
      payload.updated_at = db.fn.now();
      await db(this.tableName).where({ id }).update(payload);
    }

    return this.findById(id);
  }

  /**
   * Delete a language by ID
   * @param {number} id
   * @returns {Promise<number>}
   */
  static async delete(id) {
    return db(this.tableName).where({ id }).delete();
  }
}

module.exports = Language;
