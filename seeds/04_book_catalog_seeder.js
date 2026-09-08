/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Seed Authors for online book shopping
  const authors = [
    { name: 'J.K. Rowling', status: 1 },
    { name: 'George R.R. Martin', status: 1 },
    { name: 'Agatha Christie', status: 1 },
    { name: 'Stephen King', status: 1 },
    { name: 'Haruki Murakami', status: 1 },
    { name: 'Arthur Conan Doyle', status: 1 },
    { name: 'Jane Austen', status: 1 }
  ];

  for (const author of authors) {
    const existing = await knex('authors').where({ name: author.name }).first();
    if (!existing) {
      await knex('authors').insert({
        ...author,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  }

  // Seed Publishers for online book shopping
  const publishers = [
    { name: 'Penguin Random House', status: 1 },
    { name: 'HarperCollins', status: 1 },
    { name: 'Simon & Schuster', status: 1 },
    { name: 'Macmillan Publishers', status: 1 },
    { name: 'Hachette Book Group', status: 1 },
    { name: 'Oxford University Press', status: 1 },
    { name: 'Bloomsbury Publishing', status: 1 }
  ];

  for (const publisher of publishers) {
    const existing = await knex('publishers').where({ name: publisher.name }).first();
    if (!existing) {
      await knex('publishers').insert({
        ...publisher,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  }

  // Seed Languages for online book shopping
  const languages = [
    { name: 'English', status: 1 },
    { name: 'Spanish', status: 1 },
    { name: 'French', status: 1 },
    { name: 'German', status: 1 },
    { name: 'Japanese', status: 1 },
    { name: 'Hindi', status: 1 },
    { name: 'Tamil', status: 1 }
  ];

  for (const language of languages) {
    const existing = await knex('languages').where({ name: language.name }).first();
    if (!existing) {
      await knex('languages').insert({
        ...language,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  }
};
