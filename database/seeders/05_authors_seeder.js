const fs = require('fs');
const path = require('path');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const csvPath = path.join(__dirname, 'data', 'authors.csv');
  if (!fs.existsSync(csvPath)) return;

  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length <= 1) return;

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

  for (const line of dataLines) {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });

    if (!row.name) continue;

    const existing = await knex('authors').where({ name: row.name }).first();
    const status = row.status !== undefined ? Number(row.status) : 1;

    if (!existing) {
      await knex('authors').insert({
        name: row.name,
        status,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    } else {
      await knex('authors').where({ id: existing.id }).update({
        status,
        updated_at: knex.fn.now()
      });
    }
  }
};
