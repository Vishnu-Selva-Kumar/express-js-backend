/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Upsert (insert or update on conflict) roles
  await knex('roles')
    .insert([
      { id: 1, name: 'Administrator' },
      { id: 2, name: 'Users' }
    ])
    .onConflict('id')
    .merge();
};
