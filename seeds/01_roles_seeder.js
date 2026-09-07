const Role = require('#models/Role');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Upsert (insert or update on conflict) roles using Role model constants
  await knex('roles')
    .insert([
      { id: Role.ROLE_ADMINISTRATOR, name: 'Administrator' },
      { id: Role.ROLE_USER, name: 'User' }
    ])
    .onConflict('id')
    .merge();
};
