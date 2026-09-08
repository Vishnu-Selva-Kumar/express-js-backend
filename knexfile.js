require('dotenv').config();

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {
  development: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST || 'mysql',
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME || 'express_js',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_DATABASE || 'express_js',
      timezone: process.env.DB_TIMEZONE || '+00:00'
    },
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn, done) => {
        conn.query("SET time_zone = '+00:00';", (err) => {
          done(err, conn);
        });
      }
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './database/seeders'
    }
  },

  production: {
    client: 'mysql2',
    connection: {
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT) || 3306,
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      timezone: process.env.DB_TIMEZONE || '+00:00'
    },
    pool: {
      min: 2,
      max: 10,
      afterCreate: (conn, done) => {
        conn.query("SET time_zone = '+00:00';", (err) => {
          done(err, conn);
        });
      }
    },
    migrations: {
      directory: './database/migrations',
      tableName: 'knex_migrations'
    },
    seeds: {
      directory: './database/seeders'
    }
  }
};
