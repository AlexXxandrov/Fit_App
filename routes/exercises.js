const express = require('express');
const router = express.Router();
const pool = require('../db/pool');
const { bulkUpsert, TYPES } = require('../db/loader');

// Sembrar catálogos que vienen como archivo en el repo (idempotente, upsert).
// POST /api/exercises/seed  -> carga base + calistenia sin duplicar.
router.post('/seed', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const dir = path.join(__dirname, '..', 'db');
    const base = JSON.parse(fs.readFileSync(path.join(dir, 'exercises.seed.json'), 'utf8'));
    const cali = JSON.parse(fs.readFileSync(path.join(dir, 'calisthenics.seed.json'), 'utf8'));
    const result = await bulkUpsert([...base, ...cali]);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Tipos válidos (para que el front los consulte)
router.get('/types', (req, res) => res.json(TYPES));

// Carga masiva: acepta JSON (array), texto CSV o pegado. Body:
//   { "data": "<texto csv/json>" }  ó  { "data": [ {...}, {...} ] }
router.post('/bulk', async (req, res) => {
  try {
    const input = req.body.data ?? req.body;
    const result = await bulkUpsert(input);
    res.json(result);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Listar (opcional filtro por tipo: /api/exercises?type=cardio)
router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const q = type
      ? await pool.query('SELECT * FROM exercises WHERE type=$1 ORDER BY name', [type])
      : await pool.query('SELECT * FROM exercises ORDER BY type, name');
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Crear ejercicio  (así "alimentas" tipos de ejercicio)
router.post('/', async (req, res) => {
  try {
    const { name, type, description, default_sets, default_reps, default_duration, muscle_group } = req.body;
    const q = await pool.query(
      `INSERT INTO exercises (name,type,description,default_sets,default_reps,default_duration,muscle_group)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, type, description, default_sets || null, default_reps || null, default_duration || null, muscle_group || null]
    );
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Editar
router.put('/:id', async (req, res) => {
  try {
    const { name, type, description, default_sets, default_reps, default_duration, muscle_group } = req.body;
    const q = await pool.query(
      `UPDATE exercises SET name=$1,type=$2,description=$3,default_sets=$4,default_reps=$5,default_duration=$6,muscle_group=$7
       WHERE id=$8 RETURNING *`,
      [name, type, description, default_sets || null, default_reps || null, default_duration || null, muscle_group || null, req.params.id]
    );
    res.json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Borrar
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM exercises WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
