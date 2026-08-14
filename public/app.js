const api = (p, opts) => fetch('/api' + p, opts).then(r => r.json());
const WD = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
let routinesCache = [];

// ---------- NAV ----------
document.querySelectorAll('.tabs button').forEach(b => {
  b.onclick = () => {
    document.querySelectorAll('.tabs button').forEach(x => x.classList.remove('active'));
    document.querySelectorAll('.view').forEach(x => x.classList.remove('active'));
    b.classList.add('active');
    document.getElementById('view-' + b.dataset.v).classList.add('active');
    if (b.dataset.v === 'hoy') loadHoy();
    if (b.dataset.v === 'calendario') loadLog();
    if (b.dataset.v === 'horario') loadSchedule();
  };
});

// ---------- EJERCICIOS ----------
let exFilter = '';
async function loadExercises() {
  const list = await api('/exercises' + (exFilter ? '?type=' + exFilter : ''));
  const el = document.getElementById('ex-list');
  el.innerHTML = list.length ? '' : '<div class="empty">Sin ejercicios aún.</div>';
  for (const e of list) {
    const meta = [];
    if (e.default_sets) meta.push(`${e.default_sets}x${e.default_reps || '-'}`);
    if (e.default_duration) meta.push(`${e.default_duration}s`);
    if (e.muscle_group) meta.push(e.muscle_group);
    const svg = window.avatarFor(e.avatar, e.type);
    const lvl = e.difficulty ? `<span class="lvl ${e.difficulty}">${e.difficulty}</span>` : '';
    el.innerHTML += `<div class="card">
      <div class="exhead">
        <div class="avatar ${e.type}">${svg}</div>
        <div style="flex:1">
          <div class="row"><h3>${e.name}</h3><span class="tag ${e.type}">${e.type}</span>${lvl}</div>
          <div class="mut">${meta.join(' · ')}</div>
        </div>
      </div>
      ${e.instructions ? `<div class="instr">📋 ${e.instructions}</div>` : (e.description ? `<div class="instr">${e.description}</div>` : '')}
      <button class="btn small danger" onclick="delExercise(${e.id})">Borrar</button>
    </div>`;
  }
}

// filtro por tipo
document.getElementById('ex-filter').addEventListener('click', (ev) => {
  const b = ev.target.closest('button'); if (!b) return;
  document.querySelectorAll('#ex-filter button').forEach(x => x.classList.remove('active'));
  b.classList.add('active');
  exFilter = b.dataset.f;
  loadExercises();
});
async function addExercise() {
  const body = {
    name: document.getElementById('ex-name').value.trim(),
    type: document.getElementById('ex-type').value,
    description: document.getElementById('ex-desc').value.trim(),
    default_sets: document.getElementById('ex-sets').value,
    default_reps: document.getElementById('ex-reps').value,
    default_duration: document.getElementById('ex-dur').value,
    muscle_group: document.getElementById('ex-mg').value.trim()
  };
  if (!body.name) return alert('Ponle nombre');
  await api('/exercises', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) });
  ['ex-name','ex-desc','ex-sets','ex-reps','ex-dur','ex-mg'].forEach(id => document.getElementById(id).value='');
  loadExercises();
}
async function delExercise(id){ await api('/exercises/'+id,{method:'DELETE'}); loadExercises(); }

async function bulkLoad(){
  const data = document.getElementById('bulk-text').value.trim();
  if(!data) return alert('Pega al menos un ejercicio');
  const out = document.getElementById('bulk-result');
  out.textContent = 'Cargando…';
  const r = await api('/exercises/bulk',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({data})});
  if(r.error){ out.innerHTML = '❌ '+r.error; return; }
  let msg = `✅ ${r.inserted} nuevos · ${r.updated} actualizados`;
  if(r.skipped) msg += ` · ${r.skipped} omitidos`;
  if(r.errors && r.errors.length) msg += '<br>⚠️ '+r.errors.slice(0,5).join('<br>⚠️ ');
  out.innerHTML = msg;
  document.getElementById('bulk-text').value='';
  loadExercises();
}

// ---------- RUTINAS ----------
async function loadRoutines() {
  routinesCache = await api('/routines');
  const el = document.getElementById('rt-list');
  el.innerHTML = routinesCache.length ? '' : '<div class="empty">Aún no hay rutinas.</div>';
  for (const r of routinesCache) {
    const full = await api('/routines/' + r.id);
    const exs = full.exercises.map(x =>
      `<div class="row" style="justify-content:space-between;margin-top:6px;align-items:center">
        <div class="row" style="align-items:center">
        <div class="avatar ${x.type}" style="width:34px;height:34px;flex:0 0 34px">${window.avatarFor(x.avatar,x.type)}</div>
        <span class="tag ${x.type}">${x.type}</span> ${x.name}
        <span class="mut">${x.sets?x.sets+'x'+(x.reps||'-'):''}${x.duration?x.duration+'s':''}</span></div>
        <button class="small danger btn" onclick="delRoutineEx(${r.id},${x.id})">✕</button>
      </div>`).join('');
    el.innerHTML += `<div class="card">
      <div class="row"><h3>${r.name}</h3></div>
      <div class="mut">${r.goal||''}</div>
      ${exs || '<div class="mut" style="margin-top:6px">Sin ejercicios</div>'}
      <div class="row" style="margin-top:10px">
        <select id="add-ex-${r.id}" style="flex:1;margin:0"></select>
        <button class="btn small" onclick="addExToRoutine(${r.id})">+ Agregar</button>
      </div>
    </div>`;
  }
  // llenar selects de ejercicios en cada rutina
  const allEx = await api('/exercises');
  routinesCache.forEach(r => {
    const s = document.getElementById('add-ex-'+r.id);
    if (s) s.innerHTML = allEx.map(e=>`<option value="${e.id}">${e.name} (${e.type})</option>`).join('');
  });
  fillRoutineSelects();
}
// toggle de patrones (permite prender/apagar cada grupo)
document.addEventListener('click', (ev) => {
  const b = ev.target.closest('#gen-patterns button');
  if (b) b.classList.toggle('active');
});

async function generateRoutine() {
  const level = document.getElementById('gen-level').value;
  const patterns = [...document.querySelectorAll('#gen-patterns button.active')].map(b => b.dataset.p);
  if (!patterns.length) return alert('Elige al menos un grupo');
  const r = await api('/routines/generate', {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({ level, patterns })});
  if (r.error) return alert('⚠️ ' + r.error);
  await loadRoutines();
  alert('✅ Rutina generada: ' + r.name);
}

async function addRoutine() {
  const name = document.getElementById('rt-name').value.trim();
  if (!name) return alert('Ponle nombre');
  await api('/routines',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({name, goal:document.getElementById('rt-goal').value.trim()})});
  document.getElementById('rt-name').value=''; document.getElementById('rt-goal').value='';
  loadRoutines();
}
async function addExToRoutine(rid) {
  const exId = document.getElementById('add-ex-'+rid).value;
  await api('/routines/'+rid+'/exercises',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({exercise_id:exId})});
  loadRoutines();
}
async function delRoutineEx(rid,rexId){ await api('/routines/'+rid+'/exercises/'+rexId,{method:'DELETE'}); loadRoutines(); }

function fillRoutineSelects(){
  const opts = routinesCache.map(r=>`<option value="${r.id}">${r.name}</option>`).join('');
  ['sc-routine','rm-routine','lg-routine'].forEach(id=>{
    const el=document.getElementById(id); if(el) el.innerHTML=opts;
  });
}

// ---------- HORARIO ----------
async function loadSchedule(){
  await loadRoutines();
  const list = await api('/schedule');
  const el = document.getElementById('sc-list');
  el.innerHTML = list.length ? '' : '<div class="empty">Horario vacío.</div>';
  for (const s of list) {
    el.innerHTML += `<div class="card"><div class="row" style="justify-content:space-between">
      <div><strong>${WD[s.weekday]}</strong> ${s.time_of_day||''}<br>
      <span class="mut">${s.routine_name||'(sin rutina)'}</span></div>
      <button class="btn small danger" onclick="delSchedule(${s.id})">✕</button>
    </div></div>`;
  }
  loadReminders();
}
async function addSchedule(){
  await api('/schedule',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({weekday:+document.getElementById('sc-weekday').value,
      routine_id:document.getElementById('sc-routine').value,
      time_of_day:document.getElementById('sc-time').value})});
  loadSchedule();
}
async function delSchedule(id){ await api('/schedule/'+id,{method:'DELETE'}); loadSchedule(); }

// ---------- RECORDATORIOS ----------
async function loadReminders(){
  const list = await api('/reminders');
  const el = document.getElementById('rm-list');
  el.innerHTML='';
  for (const r of list){
    const dia = (r.weekday === null || r.weekday === undefined) ? 'Todos los días' : WD[r.weekday];
    el.innerHTML += `<div class="card"><div class="row" style="justify-content:space-between">
      <div>⏰ <strong>${dia}</strong> ${r.time_of_day}<br>
      <span class="mut">${r.routine_name||''} — ${r.message||''}</span></div>
      <button class="btn small danger" onclick="delReminder(${r.id})">✕</button>
    </div></div>`;
  }
}
async function addReminder(){
  const wdVal = document.getElementById('rm-weekday').value;
  await api('/reminders',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({routine_id:document.getElementById('rm-routine').value,
      weekday: wdVal === '' ? null : +wdVal,
      time_of_day:document.getElementById('rm-time').value,
      message:document.getElementById('rm-msg').value.trim()})});
  document.getElementById('rm-msg').value='';
  loadReminders();
}
async function delReminder(id){ await api('/reminders/'+id,{method:'DELETE'}); loadReminders(); }

// Activa el permiso de notificaciones y refleja el estado.
async function enableNotifs(){
  const status = await window.askNotifPermission();
  const el = document.getElementById('notif-status');
  const btn = document.getElementById('notif-btn');
  if (status === 'granted') {
    el.innerHTML = '✅ Notificaciones activas. Te avisaré a la hora de cada recordatorio.';
    btn.style.display = 'none';
    window.fireNotification('🏋️ FitApp', '¡Listo! Así se verán tus recordatorios.');
  } else if (status === 'denied') {
    el.innerHTML = '⚠️ Permiso bloqueado. Actívalo en los ajustes del navegador para este sitio.';
  } else if (status === 'unsupported') {
    el.innerHTML = 'ℹ️ Tu navegador no soporta notificaciones; verás un aviso dentro de la app.';
  } else {
    el.innerHTML = 'Permiso pendiente.';
  }
}

// ---------- CALENDARIO / LOG ----------
async function loadLog(){
  await loadRoutines();
  const list = await api('/log');
  const done = new Set(list.map(l => l.done_at.slice(0,10)));
  renderCalendar(done);
  const el = document.getElementById('lg-list');
  el.innerHTML = list.length ? '<h2 class="section">Historial</h2>' : '<div class="empty">Sin registros.</div>';
  for (const l of list.slice(0,30)){
    el.innerHTML += `<div class="card"><div class="row" style="justify-content:space-between">
      <div><strong>${l.done_at.slice(0,10)}</strong> — ${l.routine_name||'Entrenamiento'}
      <span class="mut">${l.duration_min?l.duration_min+' min':''}</span></div>
    </div></div>`;
  }
  document.getElementById('lg-date').value = new Date().toISOString().slice(0,10);
}
function renderCalendar(done){
  const now = new Date(), y=now.getFullYear(), m=now.getMonth();
  document.getElementById('cal-title').textContent =
    now.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
  const first = new Date(y,m,1).getDay(), days = new Date(y,m+1,0).getDate();
  const g = document.getElementById('cal-grid');
  g.innerHTML = ['D','L','M','M','J','V','S'].map(d=>`<div class="head">${d}</div>`).join('');
  for(let i=0;i<first;i++) g.innerHTML+='<div></div>';
  for(let d=1;d<=days;d++){
    const iso=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    g.innerHTML+=`<div class="d ${done.has(iso)?'done':''}">${d}</div>`;
  }
}
async function addLog(){
  await api('/log',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({routine_id:document.getElementById('lg-routine').value,
      duration_min:document.getElementById('lg-dur').value,
      done_at:document.getElementById('lg-date').value})});
  document.getElementById('lg-dur').value='';
  loadLog();
}

// ---------- HOY ----------
async function loadHoy(){
  await loadRoutines();
  const sched = await api('/schedule');
  const today = new Date().getDay();
  const mine = sched.filter(s=>s.weekday===today);
  const el = document.getElementById('hoy-content');
  if(!mine.length){
    el.innerHTML=`<div class="card" style="text-align:center">
      <p class="mut">Hoy no hay rutina programada.</p>
      <p class="mut" style="margin-top:6px">¿Entrenas de todos modos? Genero una fresca al instante:</p>
      <select id="hoy-level" style="margin-top:10px">
        <option value="principiante">Principiante</option>
        <option value="intermedio">Intermedio</option>
        <option value="avanzado">Avanzado</option>
      </select>
      <button class="btn" onclick="workoutOfTheDay()">Rutina del día 🔥</button>
    </div>
    <div id="hoy-wod"></div>`;
    return;
  }
  el.innerHTML='';
  for(const s of mine){
    const full = s.routine_id ? await api('/routines/'+s.routine_id) : {exercises:[]};
    const exs = full.exercises.map(x=>`<div class="row" style="margin-top:6px;align-items:center">
      <div class="avatar ${x.type}" style="width:38px;height:38px;flex:0 0 38px">${window.avatarFor(x.avatar,x.type)}</div>
      <span class="tag ${x.type}">${x.type}</span> ${x.name}
      <span class="mut">${x.sets?x.sets+'x'+(x.reps||'-'):''}${x.duration?x.duration+'s':''}</span></div>`).join('');
    el.innerHTML+=`<div class="card">
      <div class="row"><h3>${s.routine_name||'Rutina'}</h3><span class="mut">${s.time_of_day||''}</span></div>
      <div class="mut">${s.goal||''}</div>${exs}
      <button class="btn" onclick="quickLog(${s.routine_id})">Marcar como hecho ✓</button>
    </div>`;
  }
}
async function workoutOfTheDay(){
  const level = document.getElementById('hoy-level').value;
  const r = await api('/routines/generate',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ level })});
  if(r.error) return alert('⚠️ '+r.error);
  const full = await api('/routines/'+r.id);
  const exs = full.exercises.map(x=>`<div class="row" style="margin-top:6px;align-items:center">
    <div class="avatar ${x.type}" style="width:38px;height:38px;flex:0 0 38px">${window.avatarFor(x.avatar,x.type)}</div>
    <span class="tag ${x.type}">${x.type}</span> ${x.name}
    <span class="mut">${x.sets?x.sets+'x'+(x.reps||'-'):''}${x.duration?x.duration+'s':''}</span></div>`).join('');
  document.getElementById('hoy-wod').innerHTML=`<div class="card">
    <div class="row"><h3>${r.name}</h3><span class="lvl ${level}">${level}</span></div>
    ${exs}
    <button class="btn" onclick="quickLog(${r.id})">Marcar como hecho ✓</button>
  </div>`;
}

async function quickLog(rid){
  await api('/log',{method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({routine_id:rid})});
  alert('¡Registrado! 💪');
}

// init
loadExercises();
loadRoutines();
loadHoy();

// Motor de recordatorios de la app
window.startReminderEngine();
// Refleja estado si el permiso ya estaba concedido
if ('Notification' in window && Notification.permission === 'granted') {
  document.addEventListener('DOMContentLoaded', () => {
    const el = document.getElementById('notif-status');
    const btn = document.getElementById('notif-btn');
    if (el) el.innerHTML = '✅ Notificaciones activas.';
    if (btn) btn.style.display = 'none';
  });
}
