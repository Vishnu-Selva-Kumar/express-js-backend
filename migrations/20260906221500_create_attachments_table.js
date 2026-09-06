/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('attachments', (table) => {
    table.increments('id').primary();
    table.string('attachable_type', 100).notNullable();
    table.integer('attachable_id').unsigned().notNullable();
    table.integer('attachment_for').unsigned().notNullable();
    table.string('file_name', 255).notNullable();
    table.string('file_path', 500).notNullable();
    table.string('file_type', 100).notNullable();
    table.bigInteger('file_size').unsigned().notNullable();
    table.timestamps(true, true);

    // Indexes for polymorphic queries and fast lookups
    table.index(['attachable_type', 'attachable_id']);
    table.index(['attachable_type', 'attachable_id', 'attachment_for']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('attachments');
};
