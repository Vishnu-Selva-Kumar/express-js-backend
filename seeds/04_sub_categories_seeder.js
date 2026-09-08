const fs = require('fs');
const path = require('path');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const csvPath = path.join(__dirname, 'data', 'sub_categories.csv');
  if (!fs.existsSync(csvPath)) return;

  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  if (lines.length <= 1) return;

  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

  // Cache categories to resolve category_id
  const allCategories = await knex('categories').select('id', 'name');
  const categoryMap = new Map(allCategories.map(c => [c.name.toLowerCase(), c.id]));

  for (const line of dataLines) {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });

    if (!row.name) continue;

    const categoryId = row.category ? categoryMap.get(row.category.toLowerCase()) || null : null;
    const status = row.status !== undefined ? Number(row.status) : 1;

    const existing = await knex('sub_categories')
      .where({ name: row.name, category_id: categoryId })
      .first();

    if (!existing) {
      await knex('sub_categories').insert({
        name: row.name,
        category_id: categoryId,
        status,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    } else {
      await knex('sub_categories').where({ id: existing.id }).update({
        status,
        updated_at: knex.fn.now()
      });
    }
  }
};
