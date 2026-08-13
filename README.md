# FitApp · LEAO

App de rutinas de ejercicio: catálogo por tipo, rutinas, horario semanal, recordatorios y calendario.

## Tipos de ejercicio
- **cardio** — acelera el ritmo (correr, cuerda, burpees)
- **fuerza** — con peso (sentadilla, press, peso muerto)
- **flexibilidad** — yoga/estiramiento
- **calistenia** — peso corporal (lagartijas, dominadas, plancha)

## Correr local
1. `npm install`
2. copia `.env.example` a `.env` y pon tu DATABASE_URL
3. `npm run init-db`
4. `npm start` → http://localhost:3000

## Railway
1. Sube a GitHub, conecta el repo en Railway.
2. Add → Database → PostgreSQL (Railway inyecta DATABASE_URL).
3. Deploy. El startCommand corre init-db automáticamente.

## Alimentar ejercicios por API (PowerShell)
Invoke-RestMethod -Uri "https://TU-APP.up.railway.app/api/exercises" -Method Post -ContentType "application/json" -Body '{"name":"Zancadas","type":"fuerza","default_sets":3,"default_reps":12,"muscle_group":"piernas"}'
