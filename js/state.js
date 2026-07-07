/* ═══════════ EscapeWorld — stan gry + zapis lokalny ═══════════ */
window.EW = window.EW || {};

(function () {
  const SAVE_KEY = 'escapeworld-save-v1';
  const CAMPAIGN_KEY = 'escapeworld-campaign-v1';

  function freshPlayer() {
    return {
      lang: 'en',
      coins: 250,
      energy: 50,
      hp: 100,
      level: 1,
      xp: 0,
      distance: 0,            // metry łącznie
      distanceTaskProgress: {},// id punktu -> metry przy aktywnym zadaniu ruchowym
      completed: [],           // id ukończonych punktów
      failed: [],              // id punktów po nieudanej misji (wymagają safe zone)
      unlockedPoints: [],      // id punktów odsłoniętych (hidden=false po odblokowaniu)
      relocated: {},           // id -> {lat,lng} po przeniesieniu tropu
      mustReturnToSafeZone: false,
      inventory: {},           // itemId -> ilość
      notebook: [],            // {id, target:{...}, pl, lang, added, reps, nextReview, mastered, fav}
      artifacts: [],           // {id, name, rarity, date}
      story: [],               // {title, textPl, date}
      achievements: [],        // id
      streak: 1,
      lastPlayed: todayStr(),
      pos: null,               // {lat,lng} pozycja (sym lub GPS)
      chapter: 1,
      unlockedChapters: [1],
      translationsUsed: 0,
      log: [],                 // log zdarzeń (tryb testowy)
    };
  }

  function todayStr() { return new Date().toISOString().slice(0, 10); }

  const state = {
    player: freshPlayer(),
    campaign: null,
    mode: null,           // 'player' | 'admin'
    adminPreview: false,  // admin ogląda widok gracza
  };

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(state.player));
      localStorage.setItem(CAMPAIGN_KEY, JSON.stringify(state.campaign));
    } catch (e) { console.warn('Zapis nieudany', e); }
  }

  function load() {
    try {
      const p = localStorage.getItem(SAVE_KEY);
      if (p) state.player = Object.assign(freshPlayer(), JSON.parse(p));
      const c = localStorage.getItem(CAMPAIGN_KEY);
      state.campaign = c ? JSON.parse(c) : JSON.parse(JSON.stringify(EW.DEFAULT_CAMPAIGN));
    } catch (e) {
      state.campaign = JSON.parse(JSON.stringify(EW.DEFAULT_CAMPAIGN));
    }
    // seria dni (streak)
    const today = todayStr(), last = state.player.lastPlayed;
    if (last !== today) {
      const diff = (new Date(today) - new Date(last)) / 86400000;
      state.player.streak = diff === 1 ? state.player.streak + 1 : 1;
      state.player.lastPlayed = today;
    }
    if (!state.player.pos) state.player.pos = { ...state.campaign.meta.center };
  }

  function resetProgress() {
    const lang = state.player.lang;
    state.player = freshPlayer();
    state.player.lang = lang;
    state.player.pos = { ...state.campaign.meta.center };
    save();
  }

  function resetCampaign() {
    state.campaign = JSON.parse(JSON.stringify(EW.DEFAULT_CAMPAIGN));
    save();
  }

  /* ── pomocnicze ── */
  function getPoint(id) { return state.campaign.points.find(p => p.id === id); }

  function pointPos(p) {
    const r = state.player.relocated[p.id];
    return r ? r : { lat: p.lat, lng: p.lng };
  }

  function isPointVisible(p) {
    if (state.player.completed.includes(p.id) && ['artifact', 'diary'].includes(p.type)) return true; // zaliczone zostają wygaszone
    if (p.hidden && !state.player.unlockedPoints.includes(p.id)) return false;
    if (p.chapter && !state.player.unlockedChapters.includes(p.chapter)) return false;
    if (state.player.failed.includes(p.id) && state.player.mustReturnToSafeZone) return false; // trop zniknął
    return true;
  }

  function isPointCompleted(p) { return state.player.completed.includes(p.id); }

  function addCoins(n, why) {
    state.player.coins = Math.max(0, state.player.coins + n);
    if (n !== 0) log(`${n > 0 ? '+' : ''}${n} coins${why ? ' — ' + why : ''}`);
  }
  function addEnergy(n) { state.player.energy = Math.max(0, state.player.energy + n); }
  function addXp(n) {
    state.player.xp += n;
    const need = state.player.level * 100;
    if (state.player.xp >= need) {
      state.player.xp -= need;
      state.player.level++;
      EW.toast(`⭐ Awans! Poziom ${state.player.level}`, 'good');
      log(`Awans na poziom ${state.player.level}`);
    }
  }
  function addHp(n) { state.player.hp = Math.min(100, Math.max(0, state.player.hp + n)); }

  function log(msg) {
    state.player.log.unshift({ t: new Date().toLocaleTimeString('pl-PL'), msg });
    if (state.player.log.length > 200) state.player.log.pop();
  }

  /* ── toast ── */
  EW.toast = function (msg, kind = '') {
    const box = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast ' + kind;
    el.innerHTML = msg;
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity 0.4s'; }, 3200);
    setTimeout(() => el.remove(), 3700);
  };

  /* ── osiągnięcia ── */
  function checkAchievements() {
    for (const a of EW.ACHIEVEMENTS) {
      if (!state.player.achievements.includes(a.id) && a.check(state)) {
        state.player.achievements.push(a.id);
        addCoins(a.coins, `osiągnięcie „${a.name}”`);
        EW.toast(`🏆 Osiągnięcie: <b>${a.name}</b> (+${a.coins} 🪙)`, 'good');
      }
    }
  }

  EW.state = state;
  EW.save = save;
  EW.load = load;
  EW.resetProgress = resetProgress;
  EW.resetCampaign = resetCampaign;
  EW.getPoint = getPoint;
  EW.pointPos = pointPos;
  EW.isPointVisible = isPointVisible;
  EW.isPointCompleted = isPointCompleted;
  EW.addCoins = addCoins;
  EW.addEnergy = addEnergy;
  EW.addXp = addXp;
  EW.addHp = addHp;
  EW.log = log;
  EW.checkAchievements = checkAchievements;
})();
