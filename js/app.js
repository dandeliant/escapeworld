/* ═══════════ EscapeWorld — start aplikacji i nawigacja trybów ═══════════ */
window.EW = window.EW || {};

(function () {

  function showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id));
  }

  function showStart() {
    EW.state.adminPreview = false;
    showScreen('screen-start');
    markLang();
  }

  function showPlayer() {
    EW.state.mode = 'player';
    EW.state.adminPreview = false;
    document.getElementById('admin-preview-bar').classList.add('hidden');
    showScreen('screen-player');
    EW.ui.switchView('map');
    EW.ui.updateHud();
  }

  /* Admin ogląda dokładnie to, co zobaczy gracz — z paskiem powrotu */
  function showPlayerPreview() {
    EW.state.adminPreview = true;
    document.getElementById('admin-preview-bar').classList.remove('hidden');
    showScreen('screen-player');
    EW.ui.switchView('map');
    EW.ui.updateHud();
    EW.log('Admin: uruchomiono podgląd gracza');
  }

  function showAdmin() {
    EW.state.mode = 'admin';
    EW.state.adminPreview = false;
    document.getElementById('admin-preview-bar').classList.add('hidden');
    showScreen('screen-admin');
    EW.admin.switchView('map');
  }

  function markLang() {
    document.querySelectorAll('.lang-btn').forEach(b =>
      b.classList.toggle('selected', b.dataset.lang === EW.state.player.lang));
  }

  function init() {
    EW.load();

    // wybór języka nauki
    document.querySelectorAll('.lang-btn').forEach(b =>
      b.addEventListener('click', () => {
        EW.state.player.lang = b.dataset.lang;
        EW.save();
        markLang();
        EW.toast(`${EW.LANGS[b.dataset.lang].flag} Wybrano język nauki: <b>${EW.LANGS[b.dataset.lang].name}</b>`, 'good');
      }));
    markLang();

    document.getElementById('btn-mode-player').addEventListener('click', showPlayer);
    document.getElementById('btn-mode-admin').addEventListener('click', showAdmin);

    EW.ui.init();
    EW.admin.init();

    // autozapis co 10 s
    setInterval(EW.save, 10000);

    // rejestracja service workera (PWA — instalacja i tryb offline)
    if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
      navigator.serviceWorker.register('./sw.js').catch(e => console.warn('SW:', e));
    }
  }

  EW.app = { showStart, showPlayer, showPlayerPreview, showAdmin };

  document.addEventListener('DOMContentLoaded', init);
})();
