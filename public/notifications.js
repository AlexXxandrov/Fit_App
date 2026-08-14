// Motor de recordatorios dentro de la app.
// Pide permiso de notificaciones y revisa cada minuto si toca alguno.
// Usa localStorage-free (guarda "ya disparado hoy" en memoria) para no repetir.

const REMINDER_STATE = { fired: {}, timer: null };

// Pide permiso al usuario (idempotente).
async function askNotifPermission() {
  if (!('Notification' in window)) return 'unsupported';
  if (Notification.permission === 'granted') return 'granted';
  if (Notification.permission === 'denied') return 'denied';
  return await Notification.requestPermission();
}

// Lanza una notificación real del sistema.
function fireNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    // Fallback: si no hay permiso, al menos un aviso visual si la pestaña está activa.
    if (document.visibilityState === 'visible') {
      const bar = document.getElementById('notif-bar');
      if (bar) { bar.textContent = `🔔 ${title} — ${body}`; bar.style.display = 'block';
        setTimeout(() => { bar.style.display = 'none'; }, 8000); }
    }
    return;
  }
  const n = new Notification(title, { body, icon: '/icon.png', tag: title + body });
  n.onclick = () => { window.focus(); n.close(); };
}

// Clave única por recordatorio+día para no repetir en el mismo minuto.
function firedKey(rem, now) {
  return `${rem.id}-${now.toDateString()}-${rem.time_of_day}`;
}

// Revisa la lista de recordatorios contra la hora actual.
async function checkReminders() {
  let list;
  try { list = await fetch('/api/reminders').then(r => r.json()); }
  catch { return; }
  if (!Array.isArray(list)) return;

  const now = new Date();
  const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const today = now.getDay();

  for (const rem of list) {
    // weekday null => todos los días; si trae día, debe coincidir.
    const dayOk = (rem.weekday === null || rem.weekday === undefined || rem.weekday === today);
    if (!dayOk) continue;
    if (rem.time_of_day !== hhmm) continue;

    const key = firedKey(rem, now);
    if (REMINDER_STATE.fired[key]) continue;
    REMINDER_STATE.fired[key] = true;

    const title = '🏋️ FitApp — ¡Hora de entrenar!';
    const body = (rem.routine_name ? rem.routine_name + '. ' : '') + (rem.message || 'Tu rutina te espera 💪');
    fireNotification(title, body);
  }

  // Limpia claves viejas (más de 2 días) para no crecer indefinidamente.
  const cutoff = new Date(now.getTime() - 2 * 864e5).toDateString();
  for (const k of Object.keys(REMINDER_STATE.fired)) {
    if (k.includes(cutoff)) delete REMINDER_STATE.fired[k];
  }
}

// Arranca el ciclo: revisa ahora y luego cada 60s alineado al minuto.
function startReminderEngine() {
  checkReminders();
  const msToNextMinute = (60 - new Date().getSeconds()) * 1000;
  setTimeout(() => {
    checkReminders();
    REMINDER_STATE.timer = setInterval(checkReminders, 60000);
  }, msToNextMinute);
}

if (typeof window !== 'undefined') {
  window.askNotifPermission = askNotifPermission;
  window.startReminderEngine = startReminderEngine;
  window.fireNotification = fireNotification;
}
