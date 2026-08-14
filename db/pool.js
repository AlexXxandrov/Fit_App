const { Pool } = require('pg');
require('dotenv').config();

// Falla claro si la variable no llegó (evita el ECONNREFUSED a 127.0.0.1).
if (!process.env.DATABASE_URL) {
  console.error('\n❌ Falta DATABASE_URL.');
  console.error('   En Railway: servicio de la app -> Variables -> agrega');
  console.error('   DATABASE_URL = ${{Postgres.DATABASE_URL}}');
  console.error('   (usa el nombre real de tu servicio de Postgres)\n');
  process.exit(1);
}

const isLocal = /localhost|127\.0\.0\.1|host=\/|@\/|\.railway\.internal/.test(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Railway interno y local no requieren SSL; los hosts publicos si.
  ssl: isLocal ? false : { rejectUnauthorized: false }
});

module.exports = pool;
