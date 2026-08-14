const fs = require('fs');
const path = require('path');
const pool = require('./pool');
const { migrate } = require('./migrate');
const { bulkUpsert } = require('./loader');

async function init() {
  await migrate();
  console.log('✅ Tablas creadas / actualizadas.');

  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM exercises');
  if (rows[0].n === 0) {
    const base = JSON.parse(fs.readFileSync(path.join(__dirname, 'exercises.seed.json'), 'utf8'));
    const cali = JSON.parse(fs.readFileSync(path.join(__dirname, 'calisthenics.seed.json'), 'utf8'));
    const r = await bulkUpsert([...base, ...cali]);
    console.log(`✅ Seed: ${r.inserted} insertados, ${r.updated} actualizados.`);
    if (r.errors.length) console.log('⚠️ ', r.errors.join(' | '));
  } else {
    console.log(`ℹ️  Ya había ${rows[0].n} ejercicios, no se sembró.`);
  }

  await pool.end();
  console.log('✅ Listo.');
}

init().catch((err) => {
  console.error('❌ Error inicializando BD:', err.message || err);
  process.exit(1);
});
