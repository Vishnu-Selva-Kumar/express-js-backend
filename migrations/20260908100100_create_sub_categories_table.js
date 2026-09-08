/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('sub_categories', (table) => {
    table.increments('id').primary();
    table.integer('category_id').unsigned().nullable()
      .references('id').inTable('categories')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('name', 255).notNullable();
    table.tinyint('status', 1).notNullable().defaultTo(1);
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('sub_categories');
};
