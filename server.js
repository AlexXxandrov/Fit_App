const express = require('express');
const path = require('path');
require('dotenv').config();
const { migrate } = require('./db/migrate');

const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api', require('./routes/planner'));

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date() }));

const PORT = process.env.PORT || 3000;

// La app migra el esquema al arrancar: si el init-db falló en el deploy,
// igual se crean las tablas. Es idempotente, no borra nada.
migrate()
  .then(() => console.log('✅ Esquema verificado.'))
  .catch((e) => console.error('⚠️  No se pudo migrar al arrancar:', e.message))
  .finally(() => {
    app.listen(PORT, () => console.log(`🏋️  FitApp corriendo en puerto ${PORT}`));
  });
