const fs = require('fs');
const path = require('path');
const pool = require('./pool');

// Crea/actualiza el esquema. Idempotente (usa IF NOT EXISTS).
async function migrate() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
}

module.exports = { migrate };
