/* ═══════════ EscapeWorld — system językowy ═══════════ */
window.EW = window.EW || {};

EW.LANGS = {
  en: { name: 'Angielski', flag: '🇬🇧', code: 'EN', tts: ['en-GB', 'en-US'] },
  fr: { name: 'Francuski', flag: '🇫🇷', code: 'FR', tts: ['fr-FR'] },
  de: { name: 'Niemiecki', flag: '🇩🇪', code: 'DE', tts: ['de-DE'] },
  ru: { name: 'Rosyjski',  flag: '🇷🇺', code: 'RU', tts: ['ru-RU'] },
};

EW.POINT_TYPES = {
  mission:     { name: 'Punkt misji',      icon: '📡', color: '#00e5ff' },
  diary:       { name: 'Pamiętnik',        icon: '📔', color: '#ffc93d' },
  artifact:    { name: 'Artefakt',         icon: '💠', color: '#c07aff' },
  medkit:      { name: 'Apteczka',         icon: '⛑️', color: '#3dff9a' },
  transmitter: { name: 'Nadajnik',         icon: '📶', color: '#ff9a3d' },
  portal:      { name: 'Portal',           icon: '🌀', color: '#ff3d9a' },
  safezone:    { name: 'Bezpieczna strefa',icon: '🛡️', color: '#4da6ff' },
  falsetrail:  { name: 'Fałszywy trop',    icon: '❓', color: '#8899aa' },
  npc:         { name: 'Postać (NPC)',     icon: '🕵️', color: '#ffe14d' },
  alienbase:   { name: 'Baza obcych',      icon: '👁️', color: '#ff5566' },
};

EW.RARITIES = {
  common:    { name: 'Zwykły' },
  rare:      { name: 'Rzadki' },
  epic:      { name: 'Epicki' },
  legendary: { name: 'Legendarny' },
};

/* Pobierz treść w aktywnym języku nauki z obiektu {en,fr,de,ru} (fallback: en) */
EW.t = function (obj) {
  if (obj == null) return '';
  if (typeof obj === 'string') return obj;
  const lang = (EW.state && EW.state.player.lang) || 'en';
  return obj[lang] ?? obj.en ?? Object.values(obj)[0] ?? '';
};
