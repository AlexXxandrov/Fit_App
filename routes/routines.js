const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Listar rutinas
router.get('/', async (req, res) => {
  try {
    const q = await pool.query('SELECT * FROM routines ORDER BY created_at DESC');
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Ver una rutina con sus ejercicios (ordenados)
router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query('SELECT * FROM routines WHERE id=$1', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'No encontrada' });
    const items = await pool.query(
      `SELECT re.*, e.name, e.type, e.muscle_group
       FROM routine_exercises re
       JOIN exercises e ON e.id = re.exercise_id
       WHERE re.routine_id=$1 ORDER BY re.position`,
      [req.params.id]
    );
    res.json({ ...r.rows[0], exercises: items.rows });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Crear rutina
router.post('/', async (req, res) => {
  try {
    const { name, goal, notes } = req.body;
    const q = await pool.query(
      'INSERT INTO routines (name,goal,notes) VALUES ($1,$2,$3) RETURNING *',
      [name, goal || null, notes || null]
    );
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Agregar ejercicio a una rutina
router.post('/:id/exercises', async (req, res) => {
  try {
    const { exercise_id, sets, reps, duration, rest } = req.body;
    const pos = await pool.query(
      'SELECT COALESCE(MAX(position),-1)+1 AS p FROM routine_exercises WHERE routine_id=$1',
      [req.params.id]
    );
    const q = await pool.query(
      `INSERT INTO routine_exercises (routine_id,exercise_id,position,sets,reps,duration,rest)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.params.id, exercise_id, pos.rows[0].p, sets || null, reps || null, duration || null, rest || null]
    );
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Quitar ejercicio de una rutina
router.delete('/:id/exercises/:rexId', async (req, res) => {
  try {
    await pool.query('DELETE FROM routine_exercises WHERE id=$1 AND routine_id=$2',
      [req.params.rexId, req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Borrar rutina
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM routines WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
