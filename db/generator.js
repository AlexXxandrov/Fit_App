const pool = require('./pool');

// Patrones de movimiento y a qué ejercicios (por avatar) corresponden.
// Así garantizamos una rutina balanceada tipo coach: empuje, tracción, piernas, core, fondos.
const PATTERNS = {
  empuje:   ['pushup', 'kneepushup', 'pikepushup'],
  traccion: ['pullup', 'row'],
  piernas:  ['squat', 'chairsquat', 'lunge', 'pistol'],
  fondos:   ['dip', 'benchdip'],
  core:     ['plank', 'sideplank', 'hangingknee', 'lsit', 'dragonflag']
};

// Orden en que se incluyen los patrones (compuestos primero, core al final).
const ORDER = ['empuje', 'traccion', 'piernas', 'fondos', 'core'];

// Niveles válidos y su "escalón" (para poder incluir uno más fácil si falta).
const LEVELS = ['principiante', 'intermedio', 'avanzado'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Devuelve los ejercicios de calistenia agrupados por patrón y nivel.
async function loadPool() {
  const { rows } = await pool.query(
    `SELECT id,name,avatar,difficulty,default_sets,default_reps,default_duration
     FROM exercises WHERE type='calistenia'`
  );
  return rows;
}

// Elige un ejercicio para un patrón dado, priorizando el nivel pedido y
// cayendo a niveles más fáciles si no hay (nunca sube de nivel).
function chooseForPattern(all, avatars, level) {
  const maxIdx = LEVELS.indexOf(level);
  const candidates = all.filter(e => avatars.includes(e.avatar));
  // de más difícil permitido hacia abajo
  for (let i = maxIdx; i >= 0; i--) {
    const lvl = LEVELS[i];
    const matches = candidates.filter(e => e.difficulty === lvl);
    if (matches.length) return pick(matches);
  }
  // sin dificultad definida
  const any = candidates.filter(e => !e.difficulty);
  return any.length ? pick(any) : null;
}

// Genera y guarda una rutina. opts: { level, name?, patterns? }
async function generateRoutine(opts = {}) {
  const level = LEVELS.includes(opts.level) ? opts.level : 'principiante';
  const wanted = Array.isArray(opts.patterns) && opts.patterns.length
    ? ORDER.filter(p => opts.patterns.includes(p))
    : ORDER;

  const all = await loadPool();
  if (!all.length) throw new Error('No hay ejercicios de calistenia cargados. Corre /api/exercises/seed primero.');

  const chosen = [];
  for (const patt of wanted) {
    const ex = chooseForPattern(all, PATTERNS[patt], level);
    if (ex) chosen.push({ patt, ex });
  }
  if (!chosen.length) throw new Error('No se pudo armar la rutina con los ejercicios disponibles.');

  const name = opts.name || `Calistenia ${level} · ${new Date().toLocaleDateString('es-MX')}`;
  const goal = `Rutina de calistenia nivel ${level}, balanceada por patrones`;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const r = await client.query(
      'INSERT INTO routines (name,goal) VALUES ($1,$2) RETURNING *',
      [name, goal]
    );
    const routine = r.rows[0];

    // Series/reps sugeridas por nivel (descansos incluidos).
    const scheme = {
      principiante: { sets: 3, restSec: 60 },
      intermedio:   { sets: 4, restSec: 75 },
      avanzado:     { sets: 4, restSec: 90 }
    }[level];

    let pos = 0;
    for (const { ex } of chosen) {
      const sets = ex.default_sets || scheme.sets;
      const reps = ex.default_reps || null;
      const dur = ex.default_duration || null;
      await client.query(
        `INSERT INTO routine_exercises (routine_id,exercise_id,position,sets,reps,duration,rest)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [routine.id, ex.id, pos++, sets, reps, dur, scheme.restSec]
      );
    }
    await client.query('COMMIT');
    return routine;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { generateRoutine, LEVELS, PATTERNS };
