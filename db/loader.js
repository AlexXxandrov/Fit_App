const pool = require('./pool');

const TYPES = ['cardio', 'fuerza', 'flexibilidad', 'calistenia'];

// Sinónimos y typos comunes -> tipo canónico. Hace el parseo tolerante.
const TYPE_ALIASES = {
  cardio: 'cardio', cardiovascular: 'cardio', aerobico: 'cardio', 'aeróbico': 'cardio',
  fuerza: 'fuerza', peso: 'fuerza', pesas: 'fuerza', fuerzas: 'fuerza', gym: 'fuerza',
  flexibilidad: 'flexibilidad', flex: 'flexibilidad', yoga: 'flexibilidad',
  estiramiento: 'flexibilidad', movilidad: 'flexibilidad',
  calistenia: 'calistenia', calistenica: 'calistenia', 'peso corporal': 'calistenia', bodyweight: 'calistenia'
};

function normalizeType(raw) {
  if (!raw) return null;
  const k = String(raw).trim().toLowerCase();
  return TYPE_ALIASES[k] || (TYPES.includes(k) ? k : null);
}

function toInt(v) {
  if (v === undefined || v === null || v === '') return null;
  const n = parseInt(String(v).replace(/[^\d-]/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

// Normaliza un objeto "crudo" a la forma de la tabla. Acepta llaves flexibles.
function normalizeRow(r) {
  const name = (r.name || r.nombre || r.ejercicio || '').toString().trim();
  const type = normalizeType(r.type || r.tipo || r.categoria || r['categoría']);
  return {
    name,
    type,
    description: (r.description || r.descripcion || r['descripción'] || r.desc || '').toString().trim() || null,
    default_sets: toInt(r.default_sets ?? r.sets ?? r.series),
    default_reps: toInt(r.default_reps ?? r.reps ?? r.repeticiones),
    default_duration: toInt(r.default_duration ?? r.duration ?? r.duracion ?? r['duración'] ?? r.segundos),
    muscle_group: (r.muscle_group || r.musculo || r['músculo'] || r.grupo || '').toString().trim() || null,
    avatar: (r.avatar || r.icono || '').toString().trim() || null,
    difficulty: normalizeDifficulty(r.difficulty || r.dificultad || r.nivel),
    instructions: (r.instructions || r.instrucciones || r.como || r['cómo'] || '').toString().trim() || null
  };
}

function normalizeDifficulty(raw) {
  if (!raw) return null;
  const k = String(raw).trim().toLowerCase();
  if (/(princ|begin|basic|facil|fácil|1)/.test(k)) return 'principiante';
  if (/(inter|medio|2)/.test(k)) return 'intermedio';
  if (/(avanz|adv|hard|dif|3)/.test(k)) return 'avanzado';
  return null;
}

// ---- PARSERS ----

// CSV / texto pegado. Detecta separador , ; o TAB. 1a línea = encabezados si trae "name/nombre".
function parseDelimited(text) {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (!lines.length) return [];
  const sep = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
  const split = (l) => l.split(sep).map(c => c.trim());

  const first = split(lines[0]).map(h => h.toLowerCase());
  const hasHeader = first.some(h => ['name', 'nombre', 'ejercicio'].includes(h));

  if (hasHeader) {
    const headers = first;
    return lines.slice(1).map(line => {
      const cells = split(line);
      const obj = {};
      headers.forEach((h, i) => { obj[h] = cells[i]; });
      return obj;
    });
  }
  // Sin encabezado: asumimos orden  nombre, tipo, series, reps, duracion, musculo
  return lines.map(line => {
    const c = split(line);
    return { nombre: c[0], tipo: c[1], series: c[2], reps: c[3], duracion: c[4], musculo: c[5] };
  });
}

// Punto de entrada: acepta array de objetos, JSON string, o CSV/texto.
function parseInput(input) {
  if (Array.isArray(input)) return input;
  const text = String(input).trim();
  if (text.startsWith('[') || text.startsWith('{')) {
    const j = JSON.parse(text);
    return Array.isArray(j) ? j : [j];
  }
  return parseDelimited(text);
}

// ---- CARGA MASIVA CON UPSERT ----
// Devuelve { inserted, updated, skipped, errors:[] }
async function bulkUpsert(input) {
  let raw;
  try {
    raw = parseInput(input);
  } catch (e) {
    return { inserted: 0, updated: 0, skipped: 0, errors: [`No se pudo interpretar la entrada: ${e.message}`] };
  }

  const result = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  const client = await pool.connect();
  try {
    for (let i = 0; i < raw.length; i++) {
      const row = normalizeRow(raw[i]);
      if (!row.name) { result.skipped++; result.errors.push(`Fila ${i + 1}: sin nombre`); continue; }
      if (!row.type) { result.skipped++; result.errors.push(`Fila ${i + 1} (${row.name}): tipo inválido. Usa: ${TYPES.join(', ')}`); continue; }

      // xmax=0 en la fila devuelta => fue INSERT; si no, fue UPDATE.
      const q = await client.query(
        `INSERT INTO exercises (name,type,description,default_sets,default_reps,default_duration,muscle_group,avatar,difficulty,instructions)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
         ON CONFLICT (lower(name), type) DO UPDATE SET
           description=COALESCE(EXCLUDED.description, exercises.description),
           default_sets=COALESCE(EXCLUDED.default_sets, exercises.default_sets),
           default_reps=COALESCE(EXCLUDED.default_reps, exercises.default_reps),
           default_duration=COALESCE(EXCLUDED.default_duration, exercises.default_duration),
           muscle_group=COALESCE(EXCLUDED.muscle_group, exercises.muscle_group),
           avatar=COALESCE(EXCLUDED.avatar, exercises.avatar),
           difficulty=COALESCE(EXCLUDED.difficulty, exercises.difficulty),
           instructions=COALESCE(EXCLUDED.instructions, exercises.instructions)
         RETURNING (xmax = 0) AS inserted`,
        [row.name, row.type, row.description, row.default_sets, row.default_reps, row.default_duration, row.muscle_group, row.avatar, row.difficulty, row.instructions]
      );
      if (q.rows[0].inserted) result.inserted++; else result.updated++;
    }
  } finally {
    client.release();
  }
  return result;
}

module.exports = { bulkUpsert, parseInput, normalizeRow, normalizeType, TYPES };
