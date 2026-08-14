-- ============================================================
-- ESQUEMA FITAPP
-- ============================================================

-- Catálogo de ejercicios. Cada ejercicio pertenece a un TIPO.
CREATE TABLE IF NOT EXISTS exercises (
  id           SERIAL PRIMARY KEY,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('cardio','fuerza','flexibilidad','calistenia')),
  description  TEXT,
  -- Campos flexibles según el tipo:
  default_sets     INTEGER,      -- fuerza / calistenia
  default_reps     INTEGER,      -- fuerza / calistenia
  default_duration INTEGER,      -- segundos (cardio / flexibilidad / yoga)
  muscle_group     TEXT,         -- opcional
  avatar           TEXT,         -- clave del avatar SVG (ej. "pushup")
  difficulty       TEXT,         -- principiante | intermedio | avanzado
  instructions     TEXT,         -- cómo ejecutar el ejercicio
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Migración segura para bases ya existentes (agrega columnas si faltan).
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS difficulty TEXT;
ALTER TABLE exercises ADD COLUMN IF NOT EXISTS instructions TEXT;

-- Evita duplicados y habilita "upsert" (insertar o actualizar) por nombre+tipo.
CREATE UNIQUE INDEX IF NOT EXISTS uq_exercise_name_type
  ON exercises (lower(name), type);

-- Rutinas: un conjunto ordenado de ejercicios.
CREATE TABLE IF NOT EXISTS routines (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  goal        TEXT,   -- ej. "quemar grasa", "ganar fuerza", "movilidad"
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Ejercicios dentro de una rutina (con overrides de series/reps/duración).
CREATE TABLE IF NOT EXISTS routine_exercises (
  id           SERIAL PRIMARY KEY,
  routine_id   INTEGER NOT NULL REFERENCES routines(id) ON DELETE CASCADE,
  exercise_id  INTEGER NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  position     INTEGER NOT NULL DEFAULT 0,
  sets         INTEGER,
  reps         INTEGER,
  duration     INTEGER,   -- segundos
  rest         INTEGER    -- segundos de descanso
);

-- Horario semanal: qué rutina toca cada día.
CREATE TABLE IF NOT EXISTS schedule (
  id          SERIAL PRIMARY KEY,
  weekday     INTEGER NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Domingo
  routine_id  INTEGER REFERENCES routines(id) ON DELETE SET NULL,
  time_of_day TEXT,   -- "07:00"
  UNIQUE (weekday, time_of_day)
);

-- Recordatorios (los consulta el scheduler / futura integración WhatsApp).
CREATE TABLE IF NOT EXISTS reminders (
  id          SERIAL PRIMARY KEY,
  routine_id  INTEGER REFERENCES routines(id) ON DELETE CASCADE,
  weekday     INTEGER CHECK (weekday BETWEEN 0 AND 6),
  time_of_day TEXT NOT NULL,   -- "06:45"
  message     TEXT,
  active      BOOLEAN DEFAULT true
);

-- Registro de sesiones completadas (para el calendario / historial).
CREATE TABLE IF NOT EXISTS workout_log (
  id           SERIAL PRIMARY KEY,
  routine_id   INTEGER REFERENCES routines(id) ON DELETE SET NULL,
  done_at      DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_min INTEGER,
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);
