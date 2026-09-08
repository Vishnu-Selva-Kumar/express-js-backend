const fs = require('fs');
const path = require('path');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  const csvPath = path.join(__dirname, 'data', 'csv-sample.csv');
  if (!fs.existsSync(csvPath)) {
    return;
  }

  const fileContent = fs.readFileSync(csvPath, 'utf8');
  const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

  if (lines.length <= 1) {
    return;
  }

  // Parse header and rows
  const [headerLine, ...dataLines] = lines;
  const headers = headerLine.split(',').map(h => h.trim().toLowerCase());

  const rows = dataLines.map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((h, i) => {
      row[h] = values[i];
    });
    return row;
  });

  // Extract unique categories
  const categoryNames = [...new Set(rows.map(r => r.category).filter(Boolean))];

  for (const catName of categoryNames) {
    const existing = await knex('categories').where({ name: catName }).first();
    if (!existing) {
      await knex('categories').insert({
        name: catName,
        status: 1,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  }

  // Fetch all categories to map category_id
  const allCategories = await knex('categories').select('id', 'name');
  const categoryMap = new Map(allCategories.map(c => [c.name, c.id]));

  // Insert or update subcategories
  for (const row of rows) {
    if (!row.subcategory) continue;
    const categoryId = categoryMap.get(row.category) || null;
    const status = row.status !== undefined ? Number(row.status) : 1;

    const existingSub = await knex('sub_categories')
      .where({ name: row.subcategory, category_id: categoryId })
      .first();

    if (!existingSub) {
      await knex('sub_categories').insert({
        name: row.subcategory,
        category_id: categoryId,
        status: status,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      });
    }
  }
};
