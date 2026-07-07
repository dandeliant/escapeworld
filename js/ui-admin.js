/* ═══════════ EscapeWorld — panel administratora ═══════════ */
window.EW = window.EW || {};

(function () {
  let selectedId = null;
  let editorLang = 'en'; // aktywna zakładka językowa w kreatorze

  /* ── przełączanie widoków admina ── */
  function switchView(view) {
    document.querySelectorAll('#screen-admin .nav-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.aview === view));
    document.querySelectorAll('.aview').forEach(v =>
      v.classList.toggle('active', v.id === 'aview-' + view));
    if (view === 'map') { EW.map.initAdminMap(); setTimeout(() => EW.map.invalidate(), 60); renderPointsList(); }
    if (view === 'missions') { renderEditorList(); renderEditorForm(); }
    if (view === 'campaign') renderCampaign();
    if (view === 'data') renderData();
    if (view === 'test') renderLog();
  }

  /* ══════════ EDYTOR MAPY ══════════ */
  function fillTypeSelect(sel, val) {
    sel.innerHTML = Object.entries(EW.POINT_TYPES)
      .map(([k, t]) => `<option value="${k}" ${k === val ? 'selected' : ''}>${t.icon} ${t.name}</option>`).join('');
  }

  function addPointAt(lat, lng) {
    const type = document.getElementById('admin-new-type').value || 'mission';
    const t = EW.POINT_TYPES[type];
    const p = {
      id: 'pt-' + Date.now().toString(36),
      type, chapter: 1,
      name: `Nowy: ${t.name}`,
      lat, lng, radius: 50, maxSpeed: 30,
      descriptionPl: '',
      vanishOnFail: type !== 'safezone', relocateOnFail: false,
      penalty: { hp: 10, coins: 20 },
      content: { en: ['New point.'], fr: ['Nouveau point.'], de: ['Neuer Punkt.'], ru: ['Новая точка.'], pl: ['Nowy punkt.'] },
      questions: [],
      rewards: { coins: 100, energy: 20, xp: 30 },
    };
    if (type === 'artifact') p.rarity = 'common';
    EW.state.campaign.points.push(p);
    EW.save();
    EW.map.refreshAdminMarkers();
    renderPointsList();
    selectPoint(p.id);
    EW.toast(`➕ Dodano punkt „${p.name}”. Edytuj go w Kreatorze misji.`, 'good');
    EW.log(`Admin: dodano punkt ${p.id} (${type})`);
  }

  function deletePoint(id) {
    const p = EW.getPoint(id);
    if (!p) return;
    if (!confirm(`Usunąć punkt „${p.name}”?`)) return;
    EW.state.campaign.points = EW.state.campaign.points.filter(x => x.id !== id);
    if (selectedId === id) selectedId = null;
    EW.save();
    EW.map.refreshAdminMarkers();
    renderPointsList(); renderEditorList(); renderEditorForm();
    EW.log(`Admin: usunięto punkt ${id}`);
  }

  function selectPoint(id) {
    selectedId = id;
    renderPointsList();
    renderEditorList();
    renderEditorForm();
    const p = EW.getPoint(id);
    if (p) EW.map.adminPanTo(p);
  }

  function renderPointsList() {
    const box = document.getElementById('admin-points-list');
    if (!box) return;
    box.innerHTML = EW.state.campaign.points.map(p => {
      const t = EW.POINT_TYPES[p.type];
      return `<div class="apoint-row ${p.id === selectedId ? 'selected' : ''}" data-id="${p.id}">
        <span>${t.icon}</span><span>${p.name}</span>
        <button class="del" data-del="${p.id}" title="Usuń">🗑️</button>
      </div>`;
    }).join('');
    box.querySelectorAll('.apoint-row').forEach(r =>
      r.addEventListener('click', e => {
        if (e.target.dataset.del) { deletePoint(e.target.dataset.del); return; }
        selectPoint(r.dataset.id);
      }));
  }

  /* ══════════ KREATOR MISJI ══════════ */
  function renderEditorList() {
    const box = document.getElementById('editor-points-list');
    if (!box) return;
    box.innerHTML = EW.state.campaign.points.map(p => {
      const t = EW.POINT_TYPES[p.type];
      return `<div class="apoint-row ${p.id === selectedId ? 'selected' : ''}" data-id="${p.id}">
        <span>${t.icon}</span><span>${p.name}</span>
      </div>`;
    }).join('');
    box.querySelectorAll('.apoint-row').forEach(r =>
      r.addEventListener('click', () => selectPoint(r.dataset.id)));
  }

  function langTabsHtml() {
    return '<div class="lang-tabs">' +
      Object.entries(EW.LANGS).map(([k, l]) =>
        `<button class="lang-tab ${k === editorLang ? 'active' : ''}" data-elang="${k}">${l.flag} ${l.code}</button>`).join('') +
      '</div>';
  }

  function renderEditorForm() {
    const box = document.getElementById('editor-form');
    if (!box) return;
    const p = EW.getPoint(selectedId);
    if (!p) {
      box.innerHTML = '<p class="muted">Wybierz punkt z listy lub utwórz nowy, aby edytować misję.</p>';
      return;
    }

    const itemOpts = ['', ...EW.SHOP[0].items.map(i => i.id)]
      .map(id => `<option value="${id}" ${p.requiresItem === id || (!id && !p.requiresItem) ? 'selected' : ''}>${id || '— brak —'}</option>`).join('');
    const chapterOpts = EW.state.campaign.chapters
      .map(c => `<option value="${c.id}" ${p.chapter === c.id ? 'selected' : ''}>${c.id}. ${c.title}</option>`).join('');

    box.innerHTML = `
      <h3>✏️ ${p.name} <span class="muted small">(${p.id})</span></h3>

      <div class="field-row">
        <label class="field"><span>Nazwa punktu</span><input id="ef-name" value="${esc(p.name)}"></label>
        <label class="field"><span>Typ</span><select id="ef-type"></select></label>
      </div>
      <div class="field-row-3">
        <label class="field"><span>Rozdział</span><select id="ef-chapter">${chapterOpts}</select></label>
        <label class="field"><span>Promień aktywacji (m)</span><input id="ef-radius" type="number" value="${p.radius || 50}"></label>
        <label class="field"><span>Limit prędkości (km/h)</span><input id="ef-maxspeed" type="number" value="${p.maxSpeed || 30}"></label>
      </div>
      <div class="field-row-3">
        <label class="field"><span>Zadanie ruchowe (m, 0=brak)</span><input id="ef-disttask" type="number" value="${p.distanceTask || 0}"></label>
        <label class="field"><span>Wymagany przedmiot</span><select id="ef-reqitem">${itemOpts}</select></label>
        <label class="field"><span>Rzadkość (artefakt)</span>
          <select id="ef-rarity">${Object.entries(EW.RARITIES).map(([k, r]) =>
            `<option value="${k}" ${p.rarity === k ? 'selected' : ''}>${r.name}</option>`).join('')}</select>
        </label>
      </div>
      <label class="field"><span>Opis dla admina (PL)</span><textarea id="ef-desc">${esc(p.descriptionPl || '')}</textarea></label>

      <div class="field-row-3">
        <label class="field"><span>❤️ Kara HP</span><input id="ef-penhp" type="number" value="${p.penalty?.hp || 0}"></label>
        <label class="field"><span>🪙 Kara coins</span><input id="ef-pencoins" type="number" value="${p.penalty?.coins || 0}"></label>
        <label class="field"><span>Po błędzie</span>
          <select id="ef-fail">
            <option value="none" ${!p.vanishOnFail ? 'selected' : ''}>punkt zostaje</option>
            <option value="vanish" ${p.vanishOnFail && !p.relocateOnFail ? 'selected' : ''}>punkt znika</option>
            <option value="relocate" ${p.vanishOnFail && p.relocateOnFail ? 'selected' : ''}>znika i pojawia się gdzie indziej</option>
          </select>
        </label>
      </div>
      <div class="field-row-3">
        <label class="field"><span>🪙 Nagroda coins</span><input id="ef-rcoins" type="number" value="${p.rewards?.coins || 0}"></label>
        <label class="field"><span>⚡ Nagroda energia</span><input id="ef-renergy" type="number" value="${p.rewards?.energy || 0}"></label>
        <label class="field"><span>✨ Nagroda XP</span><input id="ef-rxp" type="number" value="${p.rewards?.xp || 0}"></label>
      </div>
      <div class="field-row">
        <label class="field"><span>Ukryty (odsłaniany przez inne punkty)</span>
          <select id="ef-hidden"><option value="no" ${!p.hidden ? 'selected' : ''}>nie</option><option value="yes" ${p.hidden ? 'selected' : ''}>tak</option></select>
        </label>
        <label class="field"><span>Odsłania punkty (id po przecinku)</span><input id="ef-unlocks" value="${(p.unlocks || []).join(', ')}"></label>
      </div>

      <h3 style="margin-top:18px">🌍 Treść dla gracza (jedno zdanie na linię)</h3>
      ${langTabsHtml()}
      <div id="ef-content-blocks">
        ${Object.keys(EW.LANGS).map(k => `
          <label class="field ${k === editorLang ? '' : 'hidden'}" data-clang="${k}">
            <span>Treść ${EW.LANGS[k].flag} ${EW.LANGS[k].code}</span>
            <textarea id="ef-content-${k}" rows="4">${esc((p.content?.[k] || []).join('\n'))}</textarea>
          </label>`).join('')}
        <label class="field"><span>Tłumaczenie 🇵🇱 PL (zdania wyrównane liniami)</span>
          <textarea id="ef-content-pl" rows="4">${esc((p.content?.pl || []).join('\n'))}</textarea>
        </label>
      </div>

      <h3 style="margin-top:18px">❓ Pytania (${(p.questions || []).length})</h3>
      <div id="ef-questions">${(p.questions || []).map((q, i) => questionEditorHtml(q, i)).join('')}</div>
      <button class="btn btn-sm" id="ef-addq">➕ Dodaj pytanie</button>

      <div style="margin-top:22px; display:flex; gap:10px; flex-wrap:wrap">
        <button class="btn btn-accent" id="ef-save">💾 Zapisz punkt</button>
        <button class="btn" id="ef-preview">👁️ Podgląd jak u gracza</button>
        <button class="btn btn-danger" id="ef-delete">🗑️ Usuń punkt</button>
      </div>`;

    fillTypeSelect(box.querySelector('#ef-type'), p.type);

    box.querySelectorAll('.lang-tab').forEach(t =>
      t.addEventListener('click', () => {
        editorLang = t.dataset.elang;
        box.querySelectorAll('.lang-tab').forEach(x => x.classList.toggle('active', x.dataset.elang === editorLang));
        box.querySelectorAll('[data-clang]').forEach(x => x.classList.toggle('hidden', x.dataset.clang !== editorLang));
      }));

    box.querySelector('#ef-addq').onclick = () => {
      savePointForm(p, true);
      p.questions = p.questions || [];
      p.questions.push({
        type: 'choice',
        prompt: { en: '', fr: '', de: '', ru: '' },
        options: { en: ['', '', ''], fr: ['', '', ''], de: ['', '', ''], ru: ['', '', ''] },
        correct: 0,
      });
      renderEditorForm();
    };

    box.querySelectorAll('[data-delq]').forEach(b =>
      b.addEventListener('click', () => {
        savePointForm(p, true);
        p.questions.splice(parseInt(b.dataset.delq), 1);
        renderEditorForm();
      }));

    box.querySelectorAll('[data-qtype]').forEach(sel =>
      sel.addEventListener('change', () => {
        savePointForm(p, true);
        const i = parseInt(sel.dataset.qtype);
        const q = p.questions[i];
        q.type = sel.value;
        if (q.type === 'choice' && !q.options) { q.options = { en: ['', '', ''], fr: ['', '', ''], de: ['', '', ''], ru: ['', '', ''] }; q.correct = 0; }
        if (q.type === 'input' && !q.answer) q.answer = { en: '', fr: '', de: '', ru: '' };
        if (q.type === 'truefalse') q.correct = true;
        renderEditorForm();
      }));

    box.querySelector('#ef-save').onclick = () => {
      savePointForm(p);
      EW.toast('💾 Zapisano punkt.', 'good');
    };
    box.querySelector('#ef-delete').onclick = () => deletePoint(p.id);
    box.querySelector('#ef-preview').onclick = () => {
      savePointForm(p, true);
      EW.app.showPlayerPreview();
      // teleportuj testowo gracza pod punkt i otwórz misję
      EW.state.player.pos = { lat: p.lat, lng: p.lng };
      EW.map.updatePlayerMarker();
      EW.map.centerOnPlayer();
      setTimeout(() => EW.game.activatePoint(p.id), 300);
    };
  }

  function questionEditorHtml(q, i) {
    const langs = Object.keys(EW.LANGS);
    let inner = `
      <div class="q-editor-head">
        <b>Pytanie ${i + 1}</b>
        <span>
          <select data-qtype="${i}">
            <option value="choice" ${q.type === 'choice' ? 'selected' : ''}>wybór (single choice)</option>
            <option value="input" ${q.type === 'input' ? 'selected' : ''}>wpisanie odpowiedzi</option>
            <option value="truefalse" ${q.type === 'truefalse' ? 'selected' : ''}>prawda / fałsz</option>
          </select>
          <button class="btn btn-sm btn-danger" data-delq="${i}">✕</button>
        </span>
      </div>`;
    for (const k of langs) {
      inner += `<label class="field"><span>Pytanie ${EW.LANGS[k].flag} ${EW.LANGS[k].code}</span>
        <input data-qprompt="${i}-${k}" value="${esc(q.prompt?.[k] || '')}"></label>`;
      if (q.type === 'choice') {
        inner += `<label class="field"><span>Odpowiedzi ${EW.LANGS[k].code} (po przecinku)</span>
          <input data-qopts="${i}-${k}" value="${esc((q.options?.[k] || []).join(', '))}"></label>`;
      }
      if (q.type === 'input') {
        inner += `<label class="field"><span>Poprawna odpowiedź ${EW.LANGS[k].code} (warianty przez |)</span>
          <input data-qans="${i}-${k}" value="${esc(q.answer?.[k] || '')}"></label>`;
      }
    }
    if (q.type === 'choice') {
      inner += `<label class="field"><span>Nr poprawnej odpowiedzi (od 0)</span>
        <input type="number" data-qcorrect="${i}" value="${q.correct || 0}"></label>`;
    }
    if (q.type === 'truefalse') {
      inner += `<label class="field"><span>Poprawna odpowiedź</span>
        <select data-qtf="${i}">
          <option value="true" ${q.correct === true ? 'selected' : ''}>prawda</option>
          <option value="false" ${q.correct === false ? 'selected' : ''}>fałsz</option>
        </select></label>`;
    }
    return `<div class="q-editor">${inner}</div>`;
  }

  function savePointForm(p, silent) {
    const g = id => document.getElementById(id);
    if (!g('ef-name')) return;
    p.name = g('ef-name').value.trim() || p.name;
    p.type = g('ef-type').value;
    p.chapter = parseInt(g('ef-chapter').value) || 1;
    p.radius = parseInt(g('ef-radius').value) || 50;
    p.maxSpeed = parseInt(g('ef-maxspeed').value) || 30;
    p.distanceTask = parseInt(g('ef-disttask').value) || 0;
    if (!p.distanceTask) delete p.distanceTask;
    p.requiresItem = g('ef-reqitem').value || null;
    if (!p.requiresItem) delete p.requiresItem;
    if (p.type === 'artifact') p.rarity = g('ef-rarity').value;
    p.descriptionPl = g('ef-desc').value;
    p.penalty = { hp: parseInt(g('ef-penhp').value) || 0, coins: parseInt(g('ef-pencoins').value) || 0 };
    const fail = g('ef-fail').value;
    p.vanishOnFail = fail !== 'none';
    p.relocateOnFail = fail === 'relocate';
    p.rewards = p.rewards || {};
    p.rewards.coins = parseInt(g('ef-rcoins').value) || 0;
    p.rewards.energy = parseInt(g('ef-renergy').value) || 0;
    p.rewards.xp = parseInt(g('ef-rxp').value) || 0;
    p.hidden = g('ef-hidden').value === 'yes';
    if (!p.hidden) delete p.hidden;
    const unlocks = g('ef-unlocks').value.split(',').map(s => s.trim()).filter(Boolean);
    if (unlocks.length) p.unlocks = unlocks; else delete p.unlocks;

    p.content = p.content || {};
    for (const k of [...Object.keys(EW.LANGS), 'pl']) {
      p.content[k] = g('ef-content-' + k).value.split('\n').map(s => s.trim()).filter(Boolean);
    }

    // pytania
    (p.questions || []).forEach((q, i) => {
      q.prompt = q.prompt || {};
      for (const k of Object.keys(EW.LANGS)) {
        const pr = document.querySelector(`[data-qprompt="${i}-${k}"]`);
        if (pr) q.prompt[k] = pr.value;
        if (q.type === 'choice') {
          const op = document.querySelector(`[data-qopts="${i}-${k}"]`);
          if (op) { q.options = q.options || {}; q.options[k] = op.value.split(',').map(s => s.trim()).filter(Boolean); }
        }
        if (q.type === 'input') {
          const an = document.querySelector(`[data-qans="${i}-${k}"]`);
          if (an) { q.answer = q.answer || {}; q.answer[k] = an.value.trim(); }
        }
      }
      const qc = document.querySelector(`[data-qcorrect="${i}"]`);
      if (qc) q.correct = parseInt(qc.value) || 0;
      const tf = document.querySelector(`[data-qtf="${i}"]`);
      if (tf) q.correct = tf.value === 'true';
    });

    EW.save();
    EW.map.refreshAdminMarkers();
    renderPointsList(); renderEditorList();
    if (!silent) EW.log(`Admin: zapisano punkt ${p.id}`);
  }

  /* ══════════ KAMPANIA ══════════ */
  function renderCampaign() {
    const st = EW.state;
    const box = document.getElementById('campaign-editor');
    box.innerHTML = `
      <div class="chapter-card">
        <label class="field"><span>Nazwa kampanii</span>
          <input id="camp-name" value="${esc(st.campaign.meta.name)}"></label>
        <div class="field-row">
          <label class="field"><span>Środek mapy — szerokość (lat)</span>
            <input id="camp-lat" type="number" step="0.0001" value="${st.campaign.meta.center.lat}"></label>
          <label class="field"><span>Środek mapy — długość (lng)</span>
            <input id="camp-lng" type="number" step="0.0001" value="${st.campaign.meta.center.lng}"></label>
        </div>
        <button class="btn btn-accent btn-sm" id="camp-save">💾 Zapisz kampanię</button>
      </div>
      <h3 style="margin:16px 0 10px">Rozdziały</h3>
      ${st.campaign.chapters.map(c => {
        const pts = st.campaign.points.filter(p => p.chapter === c.id).length;
        return `<div class="chapter-card">
          <h4>Rozdział ${c.id}: ${c.title}</h4>
          <p>${c.desc}</p>
          <div class="cstat">📍 punktów: ${pts} ${pts === 0 ? '· <i>dodaj misje w edytorze mapy</i>' : ''}</div>
        </div>`;
      }).join('')}
      <button class="btn" id="camp-addch">➕ Dodaj rozdział</button>`;

    box.querySelector('#camp-save').onclick = () => {
      st.campaign.meta.name = box.querySelector('#camp-name').value;
      st.campaign.meta.center.lat = parseFloat(box.querySelector('#camp-lat').value);
      st.campaign.meta.center.lng = parseFloat(box.querySelector('#camp-lng').value);
      EW.save();
      EW.toast('💾 Zapisano kampanię.', 'good');
    };
    box.querySelector('#camp-addch').onclick = () => {
      const id = st.campaign.chapters.length + 1;
      const title = prompt('Tytuł nowego rozdziału:', `Rozdział ${id}`);
      if (!title) return;
      st.campaign.chapters.push({ id, title, desc: '' });
      EW.save(); renderCampaign();
    };
  }

  /* ══════════ DANE ══════════ */
  function renderData() {
    document.getElementById('json-preview').textContent =
      JSON.stringify(EW.state.campaign, null, 2);
  }

  function exportCampaign() {
    const blob = new Blob([JSON.stringify(EW.state.campaign, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'escapeworld-kampania.json';
    a.click();
    URL.revokeObjectURL(a.href);
    EW.toast('⬇️ Kampania wyeksportowana.', 'good');
  }

  function importCampaign(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result);
        if (!data.points || !data.meta) throw new Error('Brak pól points/meta');
        EW.state.campaign = data;
        EW.save();
        EW.map.refreshAdminMarkers();
        renderPointsList(); renderEditorList(); renderData();
        EW.toast('⬆️ Kampania zaimportowana!', 'good');
        EW.log('Admin: zaimportowano kampanię ' + (data.meta.name || ''));
      } catch (e) {
        EW.toast('❌ Nieprawidłowy plik JSON: ' + e.message, 'bad');
      }
    };
    reader.readAsText(file);
  }

  /* ══════════ LOG ══════════ */
  function renderLog() {
    const box = document.getElementById('event-log');
    const log = EW.state.player.log;
    box.innerHTML = log.length
      ? log.map(l => `<div><span class="t">${l.t}</span>${l.msg}</div>`).join('')
      : '<p class="muted">Brak zdarzeń. Zagraj chwilę jako gracz.</p>';
  }

  /* ══════════ INIT ══════════ */
  function init() {
    document.querySelectorAll('#screen-admin .nav-btn').forEach(b =>
      b.addEventListener('click', () => switchView(b.dataset.aview)));

    fillTypeSelect(document.getElementById('admin-new-type'), 'mission');

    document.getElementById('btn-new-point').addEventListener('click', () => {
      const c = EW.map.adminCenter();
      addPointAt(c.lat, c.lng);
      switchView('missions');
    });

    document.getElementById('btn-admin-preview').addEventListener('click', () => EW.app.showPlayerPreview());
    document.getElementById('btn-home-admin').addEventListener('click', () => EW.app.showStart());

    document.getElementById('btn-export').addEventListener('click', exportCampaign);
    document.getElementById('btn-import').addEventListener('click', () => document.getElementById('import-file').click());
    document.getElementById('import-file').addEventListener('change', e => {
      if (e.target.files[0]) importCampaign(e.target.files[0]);
      e.target.value = '';
    });
    document.getElementById('btn-reset-campaign').addEventListener('click', () => {
      if (confirm('Przywrócić domyślną kampanię? Twoje zmiany zostaną nadpisane.')) {
        EW.resetCampaign();
        EW.map.refreshAdminMarkers();
        renderPointsList(); renderEditorList(); renderData();
        EW.toast('♻️ Przywrócono domyślną kampanię.');
      }
    });
    document.getElementById('btn-reset-progress').addEventListener('click', () => {
      if (confirm('Zresetować cały postęp gracza?')) {
        EW.resetProgress();
        EW.toast('🗑️ Postęp gracza zresetowany.');
      }
    });

    // tryb testowy
    document.getElementById('btn-test-coins').addEventListener('click', () => {
      EW.addCoins(1000, 'tryb testowy'); EW.save(); EW.toast('🧪 +1000 coins', 'good');
    });
    document.getElementById('btn-test-energy').addEventListener('click', () => {
      EW.addEnergy(500); EW.save(); EW.toast('🧪 +500 Lingua Energy', 'good');
    });
    document.getElementById('btn-test-heal').addEventListener('click', () => {
      EW.addHp(100); EW.save(); EW.toast('🧪 Gracz uleczony', 'good');
    });
    document.getElementById('btn-test-unlock').addEventListener('click', () => {
      const st = EW.state;
      for (const p of st.campaign.points) {
        if (p.hidden && !st.player.unlockedPoints.includes(p.id)) st.player.unlockedPoints.push(p.id);
      }
      st.player.unlockedChapters = st.campaign.chapters.map(c => c.id);
      EW.save(); EW.toast('🧪 Wszystkie punkty i rozdziały odblokowane', 'good');
      EW.log('Tryb testowy: odblokowano wszystko');
    });
    document.getElementById('btn-test-reset').addEventListener('click', () => {
      if (confirm('Zresetować postęp testowy?')) { EW.resetProgress(); EW.toast('🧪 Postęp zresetowany.'); }
    });
  }

  function esc(s) {
    return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
  }

  EW.admin = { init, switchView, addPointAt, selectPoint, deletePoint, renderPointsList };
})();
