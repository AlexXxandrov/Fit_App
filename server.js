const express = require('express');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/exercises', require('./routes/exercises'));
app.use('/api/routines', require('./routes/routines'));
app.use('/api', require('./routes/planner'));

app.get('/health', (req, res) => res.json({ ok: true, ts: new Date() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🏋️  FitApp corriendo en puerto ${PORT}`));
