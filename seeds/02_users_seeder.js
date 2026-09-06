const bcrypt = require('bcrypt');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  const password = await bcrypt.hash('password', 10);

  // Upsert (insert or update on conflict) default admin user
  await knex('users')
    .insert([
      {
        id: 1,
        role_id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        password: password,
        email_verified_at: knex.fn.now()
      }
    ])
    .onConflict('id')
    .merge();
};
