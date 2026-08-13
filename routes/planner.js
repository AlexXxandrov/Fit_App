const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// ---------- HORARIO SEMANAL ----------
router.get('/schedule', async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT s.*, r.name AS routine_name, r.goal
       FROM schedule s LEFT JOIN routines r ON r.id=s.routine_id
       ORDER BY s.weekday, s.time_of_day`
    );
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/schedule', async (req, res) => {
  try {
    const { weekday, routine_id, time_of_day } = req.body;
    const q = await pool.query(
      `INSERT INTO schedule (weekday,routine_id,time_of_day) VALUES ($1,$2,$3)
       ON CONFLICT (weekday,time_of_day) DO UPDATE SET routine_id=EXCLUDED.routine_id
       RETURNING *`,
      [weekday, routine_id || null, time_of_day || null]
    );
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/schedule/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM schedule WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- RECORDATORIOS ----------
router.get('/reminders', async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT rm.*, r.name AS routine_name
       FROM reminders rm LEFT JOIN routines r ON r.id=rm.routine_id
       WHERE rm.active=true ORDER BY rm.weekday, rm.time_of_day`
    );
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/reminders', async (req, res) => {
  try {
    const { routine_id, weekday, time_of_day, message } = req.body;
    const q = await pool.query(
      `INSERT INTO reminders (routine_id,weekday,time_of_day,message)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [routine_id || null, weekday, time_of_day, message || null]
    );
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/reminders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM reminders WHERE id=$1', [req.params.id]);
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ---------- LOG / CALENDARIO ----------
router.get('/log', async (req, res) => {
  try {
    const q = await pool.query(
      `SELECT w.*, r.name AS routine_name
       FROM workout_log w LEFT JOIN routines r ON r.id=w.routine_id
       ORDER BY w.done_at DESC LIMIT 200`
    );
    res.json(q.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/log', async (req, res) => {
  try {
    const { routine_id, done_at, duration_min, notes } = req.body;
    const q = await pool.query(
      `INSERT INTO workout_log (routine_id,done_at,duration_min,notes)
       VALUES ($1,COALESCE($2,CURRENT_DATE),$3,$4) RETURNING *`,
      [routine_id || null, done_at || null, duration_min || null, notes || null]
    );
    res.status(201).json(q.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
