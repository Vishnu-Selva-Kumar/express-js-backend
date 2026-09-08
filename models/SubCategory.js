const db = require('#database/db');

class SubCategory {
  static tableName = 'sub_categories';

  /**
   * Retrieve all subcategories with optional search, status, and category_id filter
   * @param {Object} [filter]
   * @param {string} [filter.search]
   * @param {number|string} [filter.status]
   * @param {number|string} [filter.category_id]
   * @returns {Promise<Array>}
   */
  static async all(filter = {}) {
    let query = db(this.tableName)
      .leftJoin('categories', 'sub_categories.category_id', 'categories.id')
      .select(
        'sub_categories.id',
        'sub_categories.category_id',
        'categories.name as category_name',
        'sub_categories.name',
        'sub_categories.status',
        'sub_categories.created_at',
        'sub_categories.updated_at'
      )
      .orderBy('sub_categories.id', 'asc');

    if (filter.search) {
      query = query.where('sub_categories.name', 'like', `%${filter.search}%`);
    }

    if (filter.status !== undefined && filter.status !== '') {
      query = query.where('sub_categories.status', Number(filter.status));
    }

    if (filter.category_id) {
      query = query.where('sub_categories.category_id', Number(filter.category_id));
    }

    return query;
  }

  /**
   * Find a subcategory by ID with its parent category name
   * @param {number} id
   * @returns {Promise<Object|undefined>}
   */
  static async findById(id) {
    return db(this.tableName)
      .leftJoin('categories', 'sub_categories.category_id', 'categories.id')
      .select(
        'sub_categories.id',
        'sub_categories.category_id',
        'categories.name as category_name',
        'sub_categories.name',
        'sub_categories.status',
        'sub_categories.created_at',
        'sub_categories.updated_at'
      )
      .where('sub_categories.id', id)
      .first();
  }

  /**
   * Find subcategory by name and category_id
   * @param {string} name
   * @param {number|null} [categoryId]
   * @param {number} [excludeId]
   * @returns {Promise<Object|undefined>}
   */
  static async findByName(name, categoryId = null, excludeId = null) {
    let query = db(this.tableName).where({ name });
    if (categoryId !== null) {
      query = query.where({ category_id: categoryId });
    }
    if (excludeId) {
      query = query.whereNot({ id: excludeId });
    }
    return query.first();
  }

  /**
   * Create a new subcategory
   * @param {Object} data
   * @param {string} data.name
   * @param {number|null} [data.category_id]
   * @param {number} [data.status=1]
   * @returns {Promise<Object>}
   */
  static async create(data) {
    const [id] = await db(this.tableName).insert({
      name: data.name.trim(),
      category_id: data.category_id ? Number(data.category_id) : null,
      status: data.status !== undefined ? Number(data.status) : 1,
      created_at: db.fn.now(),
      updated_at: db.fn.now()
    });

    return this.findById(id);
  }

  /**
   * Update a subcategory by ID
   * @param {number} id
   * @param {Object} data
   * @returns {Promise<Object|undefined>}
   */
  static async update(id, data) {
    const payload = {};
    if (data.name !== undefined) payload.name = data.name.trim();
    if (data.category_id !== undefined) {
      payload.category_id = data.category_id ? Number(data.category_id) : null;
    }
    if (data.status !== undefined) payload.status = Number(data.status);

    if (Object.keys(payload).length > 0) {
      payload.updated_at = db.fn.now();
      await db(this.tableName).where({ id }).update(payload);
    }

    return this.findById(id);
  }

  /**
   * Delete a subcategory by ID
   * @param {number} id
   * @returns {Promise<number>}
   */
  static async delete(id) {
    return db(this.tableName).where({ id }).delete();
  }
}

module.exports = SubCategory;
