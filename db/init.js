const fs = require('fs');
const path = require('path');
const pool = require('./pool');

async function init() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  await pool.query(schema);
  console.log('✅ Tablas creadas.');

  // Solo sembramos si la tabla está vacía.
  const { rows } = await pool.query('SELECT COUNT(*)::int AS n FROM exercises');
  if (rows[0].n === 0) {
    const seed = [
      // CARDIO
      ['Correr', 'cardio', 'Trote continuo a ritmo moderado.', null, null, 1200, 'piernas'],
      ['Saltar la cuerda', 'cardio', 'Salto continuo, acelera el ritmo cardíaco rápido.', null, null, 300, 'cuerpo completo'],
      ['Burpees', 'cardio', 'Ejercicio explosivo de cuerpo completo.', 4, 12, null, 'cuerpo completo'],
      ['Bicicleta', 'cardio', 'Pedaleo sostenido.', null, null, 1800, 'piernas'],
      // FUERZA
      ['Sentadilla con peso', 'fuerza', 'Sentadilla cargando mancuernas o barra.', 4, 10, null, 'piernas'],
      ['Press de banca', 'fuerza', 'Empuje de peso desde el pecho.', 4, 8, null, 'pecho'],
      ['Peso muerto', 'fuerza', 'Levantamiento desde el suelo.', 4, 6, null, 'espalda'],
      ['Curl de bíceps', 'fuerza', 'Flexión de brazo con mancuerna.', 3, 12, null, 'brazos'],
      // FLEXIBILIDAD / YOGA
      ['Saludo al sol', 'flexibilidad', 'Secuencia de yoga que estira todo el cuerpo.', null, null, 600, 'cuerpo completo'],
      ['Postura del perro', 'flexibilidad', 'Estiramiento de espalda y piernas.', null, null, 60, 'espalda'],
      ['Estiramiento de isquiotibiales', 'flexibilidad', 'Estiramiento estático de piernas.', null, null, 45, 'piernas'],
      // CALISTENIA
      ['Lagartijas', 'calistenia', 'Flexiones de pecho con peso corporal.', 4, 15, null, 'pecho'],
      ['Dominadas', 'calistenia', 'Tracción con peso corporal.', 4, 8, null, 'espalda'],
      ['Plancha', 'calistenia', 'Isométrico de core.', 3, null, 45, 'core'],
      ['Fondos en silla', 'calistenia', 'Empuje de tríceps con peso corporal.', 3, 12, null, 'brazos']
    ];

    for (const e of seed) {
      await pool.query(
        `INSERT INTO exercises (name, type, description, default_sets, default_reps, default_duration, muscle_group)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        e
      );
    }
    console.log(`✅ ${seed.length} ejercicios de ejemplo insertados.`);
  } else {
    console.log('ℹ️  Ya había ejercicios, no se sembró nada.');
  }

  await pool.end();
  console.log('✅ Listo.');
}

init().catch((err) => {
  console.error('❌ Error inicializando BD:', err);
  process.exit(1);
});
