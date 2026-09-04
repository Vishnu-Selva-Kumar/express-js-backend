/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.integer('role_id').unsigned().notNullable()
      .references('id').inTable('roles')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.string('name', 255).notNullable();
    table.string('email', 255).notNullable().unique();
    table.string('phone', 50).nullable();
    table.string('password', 255).notNullable();
    table.timestamp('email_verified_at').nullable();
    table.timestamp('phone_verified_at').nullable();
    table.timestamps(true, true);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTableIfExists('users');
};
