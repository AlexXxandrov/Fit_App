const { Pool } = require('pg');
require('dotenv').config();

// En Railway, DATABASE_URL se inyecta automáticamente al enlazar Postgres.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost')
    ? false
    : { rejectUnauthorized: false }
});

module.exports = pool;
