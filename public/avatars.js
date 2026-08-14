// Avatares SVG estilizados, uno por ejercicio de calistenia.
// Usan currentColor para heredar el color del tipo. 100% propios, sin dependencias.
// viewBox 0 0 100 100. Trazos gruesos estilo "coach".

const S = 'stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"';
const H = (cx, cy, r = 7) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="currentColor"/>`;
const wrap = (inner) => `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;

const AVATARS = {
  // EMPUJE
  pushup: wrap(`${H(20,45)}<g ${S}><path d="M27 47 L60 55 L82 55"/><path d="M60 55 L60 68 M82 55 L82 68"/><path d="M27 47 L45 60 M45 60 L45 68"/></g><line x1="15" y1="72" x2="90" y2="72" ${S}/>`),
  kneepushup: wrap(`${H(22,48)}<g ${S}><path d="M29 50 L58 58 L78 58"/><path d="M58 58 L58 70 M78 58 L78 70"/><path d="M29 50 L44 62 L44 70"/></g><line x1="15" y1="74" x2="88" y2="74" ${S}/>`),
  pikepushup: wrap(`${H(40,30)}<g ${S}><path d="M40 37 L55 55 L55 72"/><path d="M40 37 L28 60 L28 74"/><path d="M40 37 L52 50"/></g><line x1="18" y1="76" x2="70" y2="76" ${S}/>`),
  dip: wrap(`${H(50,25)}<g ${S}><path d="M50 32 L50 62 L44 78 M50 62 L56 78"/><path d="M50 40 L34 46 M50 40 L66 46"/></g><line x1="28" y1="44" x2="28" y2="64" ${S}/><line x1="72" y1="44" x2="72" y2="64" ${S}/>`),
  benchdip: wrap(`${H(38,28)}<g ${S}><path d="M38 35 L40 55 L62 62 L78 62"/><path d="M40 55 L30 50"/><path d="M62 62 L62 78 M78 62 L78 78"/></g><rect x="24" y="50" width="16" height="6" fill="currentColor"/>`),

  // TRACCIÓN
  pullup: wrap(`<line x1="20" y1="20" x2="80" y2="20" ${S}/>${H(50,42)}<g ${S}><path d="M50 35 L38 22 M50 35 L62 22"/><path d="M50 49 L50 74 M50 60 L42 76 M50 60 L58 76"/></g>`),
  row: wrap(`<line x1="18" y1="40" x2="82" y2="40" ${S}/>${H(30,55)}<g ${S}><path d="M35 53 L30 40 M35 53 L58 55 L78 55"/><path d="M58 55 L58 66 M78 55 L78 66"/></g>`),

  // PIERNAS
  squat: wrap(`${H(50,22)}<g ${S}><path d="M50 29 L50 50"/><path d="M50 38 L36 34 M50 38 L64 34"/><path d="M50 50 L38 58 L44 74 M50 50 L62 58 L56 74"/></g>`),
  chairsquat: wrap(`${H(42,24)}<g ${S}><path d="M42 31 L44 52"/><path d="M44 40 L60 38"/><path d="M44 52 L36 62 L36 76 M44 52 L54 60 L54 76"/></g><rect x="56" y="58" width="18" height="6" fill="currentColor"/><line x1="72" y1="58" x2="72" y2="78" ${S}/>`),
  lunge: wrap(`${H(48,22)}<g ${S}><path d="M48 29 L48 52"/><path d="M48 38 L38 42 M48 38 L58 42"/><path d="M48 52 L34 60 L34 76 M48 52 L64 66 L64 76"/></g>`),
  pistol: wrap(`${H(40,26)}<g ${S}><path d="M40 33 L42 54"/><path d="M42 42 L60 40 M42 42 L54 48"/><path d="M42 54 L34 66 L34 78"/><path d="M42 54 L66 56"/></g>`),

  // CORE
  plank: wrap(`${H(22,50)}<g ${S}><path d="M29 52 L74 60"/><path d="M29 52 L30 66 M74 60 L82 70 M74 60 L66 70"/></g><line x1="20" y1="72" x2="88" y2="72" ${S}/>`),
  sideplank: wrap(`${H(24,42)}<g ${S}><path d="M31 44 L74 66"/><path d="M31 44 L28 66"/><path d="M52 55 L52 40"/></g><line x1="20" y1="70" x2="86" y2="70" ${S}/>`),
  hangingknee: wrap(`<line x1="25" y1="18" x2="75" y2="18" ${S}/>${H(50,38)}<g ${S}><path d="M50 31 L40 20 M50 31 L60 20"/><path d="M50 45 L50 56 L38 58 M50 56 L40 68"/></g>`),
  lsit: wrap(`${H(34,34)}<g ${S}><path d="M34 41 L34 58 L78 58"/><path d="M34 50 L26 62 M34 50 L42 62"/></g><line x1="22" y1="64" x2="46" y2="64" ${S}/>`),
  dragonflag: wrap(`${H(30,58)}<g ${S}><path d="M37 56 L72 44"/><path d="M30 65 L34 58"/></g><line x1="22" y1="66" x2="40" y2="66" ${S}/><path d="M28 62 L28 52" ${S}/>`),

  // GENÉRICOS por tipo (fallback)
  cardio: wrap(`${H(50,24)}<g ${S}><path d="M50 31 L48 52"/><path d="M48 40 L34 34 M48 40 L62 46"/><path d="M48 52 L36 60 L40 76 M48 52 L60 62 L66 74"/></g>`),
  fuerza: wrap(`${H(50,24)}<g ${S}><path d="M50 31 L50 54"/><path d="M50 38 L34 34 M50 38 L66 34"/><path d="M50 54 L40 74 M50 54 L60 74"/></g><circle cx="30" cy="34" r="6" fill="currentColor"/><circle cx="70" cy="34" r="6" fill="currentColor"/>`),
  flexibilidad: wrap(`${H(38,30)}<g ${S}><path d="M38 37 L44 56 L70 62"/><path d="M44 56 L40 74"/><path d="M38 40 L56 50"/></g>`),
  calistenia: wrap(`${H(50,24)}<g ${S}><path d="M50 31 L48 52"/><path d="M48 40 L34 34 M48 40 L62 46"/><path d="M48 52 L36 60 L40 76 M48 52 L60 62 L66 74"/></g>`)
};

// Resuelve un avatar: por clave, o cae al genérico del tipo, o a un default.
function avatarFor(key, type) {
  return AVATARS[key] || AVATARS[type] || AVATARS.calistenia;
}

if (typeof window !== 'undefined') { window.AVATARS = AVATARS; window.avatarFor = avatarFor; }
if (typeof module !== 'undefined') { module.exports = { AVATARS, avatarFor }; }
