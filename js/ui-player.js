/* ═══════════ EscapeWorld — interfejs gracza ═══════════ */
window.EW = window.EW || {};

(function () {

  /* ── HUD ── */
  function updateHud() {
    const p = EW.state.player;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('hud-coins', p.coins.toLocaleString('pl-PL'));
    set('hud-energy', p.energy.toLocaleString('pl-PL'));
    set('hud-hp', p.hp);
    set('hud-level', p.level);
    set('hud-dist', p.distance >= 1000 ? (p.distance / 1000).toFixed(2) + ' km' : Math.round(p.distance) + ' m');
    set('hud-speed', EW.map.getSpeed().toFixed(0) + ' km/h');
    set('hud-chapter', 'Rozdział ' + p.chapter);
    const lang = EW.LANGS[p.lang];
    set('hud-lang', `${lang.flag} ${lang.code}`);
    const xp = document.getElementById('hud-xp');
    if (xp) xp.style.width = Math.min(100, (p.xp / (p.level * 100)) * 100) + '%';
    const due = document.getElementById('notebook-due');
    if (due) due.textContent = `Do powtórki teraz: ${EW.game.dueNotes().length} zdań`;
  }

  /* ── przełączanie widoków gracza ── */
  function switchView(view) {
    document.querySelectorAll('#player-nav .nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.view === view));
    document.querySelectorAll('.pview').forEach(v =>
      v.classList.toggle('active', v.id === 'pview-' + view));
    if (view === 'map') { EW.map.initPlayerMap(); setTimeout(() => EW.map.invalidate(), 60); }
    if (view === 'missions') renderMissions();
    if (view === 'notebook') renderNotebook();
    if (view === 'inventory') renderInventory();
    if (view === 'shop') renderShop();
    if (view === 'artifacts') renderArtifacts();
    if (view === 'achievements') renderAchievements();
    if (view === 'story') renderStory();
  }

  /* ── MISJE ── */
  function renderMissions() {
    const st = EW.state;
    const box = document.getElementById('missions-list');
    box.innerHTML = '';
    for (const p of st.campaign.points) {
      const t = EW.POINT_TYPES[p.type];
      const done = EW.isPointCompleted(p);
      const visible = EW.isPointVisible(p);
      const failed = st.player.failed.includes(p.id);
      let status, cls;
      if (done) { status = '✅ Ukończono'; cls = 'done'; }
      else if (failed) { status = '💥 Trop zniknął — wróć do bezpiecznej strefy'; cls = 'failed'; }
      else if (!visible) { status = '🔒 Nieodkryta'; cls = 'locked'; }
      else { status = '📍 Dostępna na mapie'; cls = 'avail'; }
      const d = EW.map.haversine(st.player.pos, EW.pointPos(p));
      box.innerHTML += `
        <div class="mission-row" style="${!visible && !done ? 'opacity:0.45' : ''}">
          <span class="mi">${t.icon}</span>
          <div class="mtxt">
            <h4>${visible || done ? p.name : '???'}</h4>
            <span class="muted small">${t.name} · Rozdział ${p.chapter || 1}${visible ? ' · ' + Math.round(d) + ' m od Ciebie' : ''}</span>
          </div>
          <span class="mstatus ${cls}">${status}</span>
        </div>`;
    }
  }

  /* ── NOTATNIK ── */
  function renderNotebook() {
    const st = EW.state;
    const box = document.getElementById('notebook-list');
    if (!st.player.notebook.length) {
      box.innerHTML = '<p class="muted">Notatnik pusty. Klikaj zdania w pamiętnikach i wybieraj „Dodaj do nauki”.</p>';
      return;
    }
    box.innerHTML = '';
    for (const n of [...st.player.notebook].reverse()) {
      const target = n.target[st.player.lang] || n.target.en;
      const dueNow = !n.mastered && n.nextReview <= Date.now();
      box.innerHTML += `
        <div class="note-row">
          <div class="ntxt">
            <div class="ntarget">${n.fav ? '⭐ ' : ''}${target}</div>
            <div class="npl">🇵🇱 ${n.pl}</div>
            <div class="nmeta ${n.mastered ? 'mastered' : ''}">
              ${n.mastered ? '⭐ OPANOWANE' : `powtórki: ${n.reps}/3 · ${dueNow ? '<b style="color:var(--amber)">do powtórki teraz</b>' : 'następna: ' + new Date(n.nextReview).toLocaleDateString('pl-PL')}`}
            </div>
          </div>
          <div class="note-btns">
            <button class="icon-btn" title="Odsłuchaj" onclick="EW.speech.speak(${JSON.stringify(target).replace(/"/g, '&quot;')}, '${st.player.lang}')">🔊</button>
            <button class="icon-btn" title="Usuń" onclick="EW.ui.removeNote('${n.id}')">🗑️</button>
          </div>
        </div>`;
    }
  }

  function removeNote(id) {
    EW.state.player.notebook = EW.state.player.notebook.filter(n => n.id !== id);
    EW.save(); renderNotebook(); updateHud();
  }

  /* ── EKWIPUNEK ── */
  function renderInventory() {
    const st = EW.state;
    const box = document.getElementById('inventory-list');
    const items = Object.entries(st.player.inventory).filter(([, n]) => n > 0);
    if (!items.length) {
      box.innerHTML = '<p class="muted">Ekwipunek pusty. Zdobywaj przedmioty w misjach lub kupuj w sklepie.</p>';
      return;
    }
    box.innerHTML = '';
    for (const [id, count] of items) {
      const item = EW.SHOP.flatMap(s => s.items).find(i => i.id === id) || { name: id, icon: '📦', desc: '' };
      box.innerHTML += `
        <div class="card">
          <span class="card-ico">${item.icon}</span>
          <h4>${item.name} ×${count}</h4>
          <p>${item.desc}</p>
          <button class="btn btn-sm btn-accent" style="margin-top:10px" onclick="EW.game.useItem('${id}')">Użyj</button>
        </div>`;
    }
  }

  /* ── SKLEP ── */
  function renderShop() {
    const st = EW.state;
    const box = document.getElementById('shop-list');
    box.innerHTML = '';
    for (const section of EW.SHOP) {
      let html = `<div class="shop-section"><h3>${section.section}</h3><div class="card-grid">`;
      for (const item of section.items) {
        const afford = st.player.coins >= item.price;
        html += `
          <div class="card ${afford ? '' : 'locked'}">
            <span class="card-ico">${item.icon}</span>
            <h4>${item.name}</h4>
            <p>${item.desc}</p>
            <span class="price">🪙 ${item.price.toLocaleString('pl-PL')}</span>
            ${item.passive
              ? '<p class="small" style="color:var(--cyan);margin-top:6px">Zakup kontekstowy</p>'
              : `<button class="btn btn-sm ${afford ? 'btn-accent' : ''}" style="margin-top:10px" ${afford ? '' : 'disabled'} onclick="EW.game.buyItem('${item.id}')">Kup</button>`}
          </div>`;
      }
      html += '</div></div>';
      box.innerHTML += html;
    }
  }

  /* ── ARTEFAKTY ── */
  function renderArtifacts() {
    const st = EW.state;
    const box = document.getElementById('artifacts-list');
    const all = st.campaign.points.filter(p => p.type === 'artifact');
    box.innerHTML = '';
    for (const p of all) {
      const found = st.player.artifacts.find(a => a.id === p.id);
      const r = p.rarity || 'common';
      box.innerHTML += `
        <div class="card ${found ? 'rarity-' + r : 'locked'}">
          <span class="card-ico">${found ? '💠' : '❔'}</span>
          <h4>${found ? p.name : '???'}</h4>
          <span class="rarity-tag ${r}">${EW.RARITIES[r].name}</span>
          <p>${found ? p.descriptionPl : 'Nieodkryty artefakt. Szukaj sygnałów na mapie.'}</p>
          ${found ? `<p class="small muted">Zdobyto: ${new Date(found.date).toLocaleDateString('pl-PL')}</p>` : ''}
        </div>`;
    }
  }

  /* ── OSIĄGNIĘCIA ── */
  function renderAchievements() {
    const st = EW.state;
    const box = document.getElementById('achievements-list');
    box.innerHTML = '';
    for (const a of EW.ACHIEVEMENTS) {
      const got = st.player.achievements.includes(a.id);
      box.innerHTML += `
        <div class="card ${got ? '' : 'locked'}">
          <span class="card-ico">${a.icon}</span>
          <h4>${a.name}</h4>
          <p>${a.desc}</p>
          <span class="price">${got ? '✅ Zdobyto' : '+' + a.coins + ' 🪙'}</span>
        </div>`;
    }
  }

  /* ── HISTORIA ── */
  function renderStory() {
    const st = EW.state;
    const box = document.getElementById('story-list');
    if (!st.player.story.length) {
      box.innerHTML = '<p class="muted">Historia czeka na odkrycie. Ukończ pierwszą misję, aby poznać prawdę o inwazji.</p>';
      return;
    }
    box.innerHTML = '';
    for (const s of st.player.story) {
      box.innerHTML += `
        <div class="story-entry">
          <h4>${s.title}</h4>
          <p>${s.textPl}</p>
          <p class="small muted" style="margin-top:6px">${new Date(s.date).toLocaleString('pl-PL')}</p>
        </div>`;
    }
  }

  /* ── zmiana języka nauki w locie ── */
  function cycleLang() {
    const langs = Object.keys(EW.LANGS);
    const cur = langs.indexOf(EW.state.player.lang);
    const next = langs[(cur + 1) % langs.length];
    EW.state.player.lang = next;
    EW.save();
    updateHud();
    EW.toast(`${EW.LANGS[next].flag} Język nauki: <b>${EW.LANGS[next].name}</b>. Wszystkie zadania i pamiętniki są teraz w tym języku.`, 'good');
  }

  /* ── zdarzenia ── */
  function init() {
    // nawigacja
    document.querySelectorAll('#player-nav .nav-btn').forEach(b =>
      b.addEventListener('click', () => switchView(b.dataset.view)));

    // d-pad symulacji
    document.querySelectorAll('.sim-dpad button').forEach(b =>
      b.addEventListener('click', () => EW.map.setSimDir(b.dataset.dir)));

    // suwak prędkości
    const slider = document.getElementById('sim-speed');
    slider.addEventListener('input', () => {
      EW.map.setSimSpeed(parseInt(slider.value));
      document.getElementById('sim-speed-label').textContent = slider.value + ' km/h';
    });

    // przełącznik GPS
    document.getElementById('btn-toggle-gps').addEventListener('click', function () {
      if (EW.map.isSim()) {
        if (EW.map.enableRealGps()) {
          this.textContent = 'GPS: REAL';
          document.getElementById('sim-panel').style.opacity = '0.5';
          EW.toast('🛰️ Prawdziwy GPS włączony. Wyjdź w teren!', 'good');
        }
      } else {
        EW.map.disableRealGps();
        this.textContent = 'GPS: SYM';
        document.getElementById('sim-panel').style.opacity = '1';
        EW.toast('🧭 Powrót do symulacji GPS.');
      }
    });

    // język
    document.getElementById('hud-lang').addEventListener('click', cycleLang);

    // powtórki
    document.getElementById('btn-review').addEventListener('click', EW.game.startReview);

    // modal misji
    document.getElementById('mm-close').addEventListener('click', EW.game.closeMission);
    document.getElementById('mission-modal').addEventListener('click', e => {
      if (e.target.id === 'mission-modal') EW.game.closeMission();
    });

    // menu zdania
    document.querySelectorAll('#sentence-menu button').forEach(b =>
      b.addEventListener('click', e => { e.stopPropagation(); EW.game.sentenceMenuAction(b.dataset.act); }));
    document.addEventListener('click', () => EW.game.hideSentenceMenu());

    // logo → ekran startowy
    document.getElementById('btn-home').addEventListener('click', () => EW.app.showStart());

    // powrót z podglądu gracza do admina
    document.getElementById('btn-back-to-admin').addEventListener('click', () => EW.app.showAdmin());
  }

  EW.ui = {
    init, updateHud, switchView,
    renderMissions, renderNotebook, renderInventory, renderShop,
    renderArtifacts, renderAchievements, renderStory, removeNote,
  };
})();
