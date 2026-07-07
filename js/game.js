/* ═══════════ EscapeWorld — logika rozgrywki ═══════════ */
window.EW = window.EW || {};

(function () {
  const SPEED_LIMIT_DEFAULT = 30; // km/h

  let activePointId = null;   // punkt w zasięgu (pokazuje przycisk „Aktywuj”)
  let missionPoint = null;    // punkt otwarty w modalu
  let qIndex = 0;
  let qCorrect = 0;

  /* ══════════ RUCH ══════════ */
  function onMoved(meters) {
    const p = EW.state.player;
    p.distance += meters;

    // nagrody za dystans (100 m / 500 m / 1 km / 5 km)
    p.distAwarded = p.distAwarded || {};
    for (const r of EW.DISTANCE_REWARDS) {
      const before = p.distAwarded[r.every] || 0;
      const now = Math.floor(p.distance / r.every);
      if (now > before) {
        const gained = (now - before) * r.coins;
        p.distAwarded[r.every] = now;
        EW.addCoins(gained, `spacer ${r.every >= 1000 ? (r.every / 1000) + ' km' : r.every + ' m'}`);
        EW.toast(`👣 ${r.every >= 1000 ? (r.every / 1000) + ' km' : r.every + ' m'} marszu! +${gained} 🪙`, 'good');
      }
    }

    // zadania ruchowe (np. „przejdź 700 m”)
    for (const id in p.distanceTaskProgress) {
      if (p.distanceTaskProgress[id] >= 0) p.distanceTaskProgress[id] += meters;
    }

    EW.checkAchievements();
    EW.ui.updateHud();
  }

  /* ══════════ TICK — wykrywanie bliskości ══════════ */
  function onTick() {
    const st = EW.state;
    EW.ui.updateHud();

    // najbliższy nieukończony, widoczny punkt
    let nearest = null, nearestD = Infinity;
    for (const p of st.campaign.points) {
      if (!EW.isPointVisible(p) || EW.isPointCompleted(p)) continue;
      const d = EW.map.haversine(st.player.pos, EW.pointPos(p));
      if (d < nearestD) { nearestD = d; nearest = p; }
    }

    const hint = document.getElementById('nearest-hint');
    if (hint) {
      if (nearest) {
        const t = EW.POINT_TYPES[nearest.type];
        hint.textContent = `${t.icon} ${nearest.name} — ${Math.round(nearestD)} m`;
      } else {
        hint.textContent = '✅ Sektor oczyszczony — czekaj na nowe sygnały';
      }
    }

    // punkt w zasięgu aktywacji?
    const inRange = nearest && nearestD <= (nearest.radius || 50) ? nearest : null;
    if (inRange && inRange.id !== activePointId) {
      activePointId = inRange.id;
      showActivateFab(inRange);
    } else if (!inRange && activePointId) {
      activePointId = null;
      hideActivateFab();
    }
  }

  function showActivateFab(p) {
    hideActivateFab();
    const t = EW.POINT_TYPES[p.type];
    const btn = document.createElement('button');
    btn.className = 'activate-fab';
    btn.id = 'activate-fab';
    btn.innerHTML = `${t.icon} Aktywuj: ${p.name}`;
    btn.onclick = () => activatePoint(p.id);
    document.getElementById('pview-map').appendChild(btn);
  }
  function hideActivateFab() {
    const b = document.getElementById('activate-fab');
    if (b) b.remove();
  }

  function onPointClicked(id) {
    const p = EW.getPoint(id);
    if (!p) return;
    const d = EW.map.haversine(EW.state.player.pos, EW.pointPos(p));
    if (d <= (p.radius || 50)) activatePoint(id);
    else EW.toast(`🚶 Za daleko — do punktu „${p.name}” masz ${Math.round(d)} m. Dojdź pieszo!`);
  }

  /* ══════════ AKTYWACJA PUNKTU ══════════ */
  function activatePoint(id) {
    const st = EW.state, p = EW.getPoint(id);
    if (!p) return;

    if (EW.isPointCompleted(p)) { EW.toast('✅ Ten punkt został już ukończony.'); return; }

    // limit prędkości
    const limit = p.maxSpeed || SPEED_LIMIT_DEFAULT;
    if (EW.map.getSpeed() > limit) {
      EW.toast('🚫 Poruszasz się za szybko. Misje aktywują się tylko podczas marszu.', 'bad');
      EW.log(`Odmowa aktywacji „${p.name}” — prędkość ${EW.map.getSpeed().toFixed(0)} km/h > ${limit} km/h`);
      return;
    }

    // po porażce najpierw bezpieczna strefa
    if (st.player.mustReturnToSafeZone && p.type !== 'safezone') {
      EW.toast('🛡️ Trop zniknął! Wróć do bezpiecznej strefy po nowe wytyczne.', 'warn');
      return;
    }

    // wymagany przedmiot
    if (p.requiresItem && !(st.player.inventory[p.requiresItem] > 0)) {
      const item = EW.SHOP.flatMap(s => s.items).find(i => i.id === p.requiresItem);
      EW.toast(`🔒 Potrzebujesz: <b>${item ? item.name : p.requiresItem}</b> (kup w sklepie).`, 'warn');
      return;
    }

    // wymagane wcześniejsze punkty
    if (p.requiresPoints && !p.requiresPoints.every(r => st.player.completed.includes(r))) {
      const missing = p.requiresPoints.filter(r => !st.player.completed.includes(r))
        .map(r => (EW.getPoint(r) || {}).name || r).join(', ');
      EW.toast(`🔒 Portal nieaktywny. Najpierw ukończ: ${missing}`, 'warn');
      return;
    }

    // zadanie ruchowe
    if (p.distanceTask) {
      const prog = st.player.distanceTaskProgress[p.id];
      if (prog === undefined) {
        st.player.distanceTaskProgress[p.id] = 0;
        EW.save();
        EW.toast(`🏃 Zadanie ruchowe: przejdź <b>${p.distanceTask} m</b>, a potem wróć do punktu!`, 'warn');
        openMission(p, { infoOnly: true });
        return;
      }
      if (prog < p.distanceTask) {
        EW.toast(`🏃 Przeszedłeś ${Math.round(prog)} m z ${p.distanceTask} m. Idź dalej!`, 'warn');
        return;
      }
    }

    // bezpieczna strefa — odzyskanie tropów
    if (p.type === 'safezone') {
      if (st.player.mustReturnToSafeZone) {
        st.player.mustReturnToSafeZone = false;
        st.player.failed = [];
        EW.addHp(20);
        EW.toast('🛡️ Nowe wytyczne odebrane! Tropy pojawiły się w nowych miejscach na mapie.', 'good');
        EW.log('Bezpieczna strefa: tropy odzyskane po porażce');
        EW.save();
        EW.map.refreshPlayerMarkers();
      }
      openMission(p, { infoOnly: true });
      return;
    }

    openMission(p);
  }

  /* ══════════ MODAL MISJI ══════════ */
  function openMission(p, opts = {}) {
    missionPoint = p;
    qIndex = 0; qCorrect = 0;

    const t = EW.POINT_TYPES[p.type];
    document.getElementById('mm-type').textContent =
      `${t.name}${p.rarity ? ' · ' + EW.RARITIES[p.rarity].name : ''} · Rozdział ${p.chapter || 1}`;
    document.getElementById('mm-title').textContent = `${t.icon} ${p.name}`;

    renderStory(p, opts);
    document.getElementById('mission-modal').classList.remove('hidden');
  }

  function closeMission() {
    document.getElementById('mission-modal').classList.add('hidden');
    EW.speech.stop();
    missionPoint = null;
    hideSentenceMenu();
  }

  /* ── ekran fabularny z klikalnymi zdaniami + pasek TTS ── */
  function renderStory(p, opts = {}) {
    const lang = EW.state.player.lang;
    const sentences = (p.content && (p.content[lang] || p.content.en)) || [];
    const body = document.getElementById('mm-body');
    const foot = document.getElementById('mm-foot');

    let html = '<div class="story-text">';
    sentences.forEach((s, i) => {
      html += `<span class="sentence" data-idx="${i}">${s}</span> `;
    });
    html += '</div>';
    html += ttsBarHtml();
    body.innerHTML = html;

    // interakcja ze zdaniem
    body.querySelectorAll('.sentence').forEach(el => {
      el.addEventListener('click', e => {
        e.stopPropagation();
        showSentenceMenu(e, p, parseInt(el.dataset.idx), el);
      });
    });
    wireTtsBar(body, sentences.join(' '), lang);

    foot.innerHTML = '';
    if (opts.infoOnly || !p.questions || p.questions.length === 0) {
      const done = EW.isPointCompleted(p);
      const btn = document.createElement('button');
      if (!done && !opts.infoOnly) {
        btn.className = 'btn btn-accent';
        btn.textContent = '✔ Zabierz / Zakończ';
        btn.onclick = () => completeMission(p);
      } else {
        btn.className = 'btn';
        btn.textContent = 'Zamknij';
        btn.onclick = closeMission;
      }
      foot.appendChild(btn);
      // zadanie ruchowe zakończone?
      if (opts.infoOnly && p.distanceTask) {
        const prog = EW.state.player.distanceTaskProgress[p.id] || 0;
        if (prog >= p.distanceTask && !EW.isPointCompleted(p)) {
          const b2 = document.createElement('button');
          b2.className = 'btn btn-accent';
          b2.textContent = '✔ Zadanie ruchowe wykonane — odbierz nagrodę';
          b2.onclick = () => completeMission(p);
          foot.appendChild(b2);
        }
      }
    } else {
      const btn = document.createElement('button');
      btn.className = 'btn btn-accent';
      btn.textContent = `🎯 Rozpocznij zadanie (${p.questions.length} pytania)`;
      btn.onclick = () => renderQuestion(p);
      foot.appendChild(btn);
    }
  }

  function ttsBarHtml() {
    if (!EW.speech.ttsAvailable) {
      return '<div class="tts-bar">⚠️ Przeglądarka nie wspiera syntezatora mowy — czytaj samodzielnie, agencie.</div>';
    }
    const lang = EW.state.player.lang;
    const voices = EW.speech.voicesFor(lang);
    const voiceOpts = voices.map(v => `<option value="${v.voiceURI}">${v.name}</option>`).join('');
    return `
      <div class="tts-bar">
        <button class="btn btn-sm btn-accent" data-tts="all">▶ Odtwórz całość</button>
        <button class="btn btn-sm" data-tts="stop">■ Stop</button>
        <label>Głos: <select data-tts="voice">${voiceOpts || '<option value="">domyślny</option>'}</select></label>
        <label>Tempo: <select data-tts="rate">
          <option value="0.5">50%</option><option value="0.75">75%</option>
          <option value="1" selected>100%</option><option value="1.25">125%</option>
        </select></label>
      </div>`;
  }

  function wireTtsBar(root, fullText, lang) {
    const rateSel = root.querySelector('[data-tts="rate"]');
    const voiceSel = root.querySelector('[data-tts="voice"]');
    if (rateSel) rateSel.onchange = () => EW.speech.setRate(parseFloat(rateSel.value));
    const all = root.querySelector('[data-tts="all"]');
    if (all) all.onclick = () => EW.speech.speak(fullText, lang, voiceSel ? voiceSel.value : null);
    const stop = root.querySelector('[data-tts="stop"]');
    if (stop) stop.onclick = () => EW.speech.stop();
  }

  /* ══════════ MENU KONTEKSTOWE ZDANIA ══════════ */
  let menuCtx = null; // {point, idx, el}

  function showSentenceMenu(e, point, idx, el) {
    menuCtx = { point, idx, el };
    const menu = document.getElementById('sentence-menu');
    menu.classList.remove('hidden');
    const mw = 240, mh = 270;
    let x = Math.min(e.clientX, window.innerWidth - mw - 10);
    let y = Math.min(e.clientY, window.innerHeight - mh - 10);
    menu.style.left = x + 'px'; menu.style.top = y + 'px';
  }

  function hideSentenceMenu() {
    document.getElementById('sentence-menu').classList.add('hidden');
    menuCtx = null;
  }

  function sentenceMenuAction(act) {
    if (!menuCtx) return;
    const { point, idx, el } = menuCtx;
    const st = EW.state, lang = st.player.lang;
    const sentence = (point.content[lang] || point.content.en)[idx];
    const plSentence = (point.content.pl || [])[idx] || '(brak tłumaczenia)';

    switch (act) {
      case 'play':
        EW.speech.speak(sentence, lang);
        break;

      case 'word': {
        // zamień menu na listę słów do odsłuchania
        const menu = document.getElementById('sentence-menu');
        const words = sentence.split(/\s+/).map(w => w.replace(/[.,!?;:„”"«»()]/g, '')).filter(Boolean);
        menu.innerHTML = words.map(w => `<button data-word="${w}">🔊 ${w}</button>`).join('');
        menu.querySelectorAll('[data-word]').forEach(b => {
          b.onclick = ev => { ev.stopPropagation(); EW.speech.speak(b.dataset.word, lang); };
        });
        return; // nie zamykaj
      }

      case 'translate': {
        if (el.querySelector && el.nextElementSibling?.classList?.contains('sentence-translation')) break;
        if (st.player.coins < 100) {
          EW.toast('⚡ Za mało coins! Zdobądź więcej Lingua Energy (mów, ucz się, chodź).', 'warn');
          break;
        }
        EW.addCoins(-100, 'tłumaczenie zdania');
        st.player.translationsUsed++;
        el.classList.add('translated');
        const tr = document.createElement('span');
        tr.className = 'sentence-translation';
        tr.textContent = '🇵🇱 ' + plSentence;
        el.after(tr);
        EW.save(); EW.ui.updateHud();
        break;
      }

      case 'learn': {
        addToNotebook(point, idx, false);
        break;
      }

      case 'fav': {
        addToNotebook(point, idx, true);
        break;
      }

      case 'grammar': {
        if (st.player.coins < 150) {
          EW.toast('⚡ Analiza gramatyczna kosztuje 150 🪙 — za mało coins.', 'warn');
          break;
        }
        EW.addCoins(-150, 'analiza gramatyczna');
        const words = sentence.split(/\s+/).filter(Boolean);
        EW.toast(`🔎 <b>Analiza:</b> ${words.length} słów · pierwsze („${words[0]}”) otwiera zdanie, ostatnie („${words[words.length - 1]}”) je domyka. Zwróć uwagę na szyk!`);
        EW.save(); EW.ui.updateHud();
        break;
      }
    }
    hideSentenceMenu();
  }

  function addToNotebook(point, idx, fav) {
    const st = EW.state;
    const entryId = `${point.id}#${idx}`;
    let n = st.player.notebook.find(x => x.id === entryId);
    if (!n) {
      n = {
        id: entryId,
        target: {
          en: (point.content.en || [])[idx] || '',
          fr: (point.content.fr || [])[idx] || '',
          de: (point.content.de || [])[idx] || '',
          ru: (point.content.ru || [])[idx] || '',
        },
        pl: (point.content.pl || [])[idx] || '',
        lang: st.player.lang,
        added: Date.now(),
        reps: 0,
        nextReview: Date.now(), // od razu dostępne do pierwszej powtórki
        mastered: false,
        fav: false,
      };
      st.player.notebook.push(n);
      EW.addCoins(20, 'nowe zdanie w notatniku');
      if (st.player.notebook.length % 10 === 0) {
        EW.addCoins(300, 'seria 10 nowych wpisów');
        EW.toast('📚 Seria 10 wpisów! +300 🪙', 'good');
      }
      EW.toast(fav ? '⭐ Dodano do ulubionych i do nauki (+20 🪙)' : '📖 Dodano do nauki (+20 🪙)', 'good');
    } else {
      EW.toast(fav ? '⭐ Oznaczono jako ulubione' : 'ℹ️ To zdanie już jest w notatniku');
    }
    if (fav) n.fav = true;
    EW.checkAchievements();
    EW.save(); EW.ui.updateHud();
  }

  /* ══════════ PYTANIA ══════════ */
  function renderQuestion(p) {
    const lang = EW.state.player.lang;
    const q = p.questions[qIndex];
    const body = document.getElementById('mm-body');
    const foot = document.getElementById('mm-foot');
    foot.innerHTML = '';

    const prompt = EW.t(q.prompt);
    let html = `<div class="question-block">
      <div class="q-progress">PYTANIE ${qIndex + 1} / ${p.questions.length} — odpowiadaj w języku nauki</div>
      <div class="q-prompt">${prompt}
        <button class="icon-btn" title="Odsłuchaj pytanie" id="q-tts">🔊</button>
      </div>`;

    if (q.type === 'choice') {
      const opts = q.options[lang] || q.options.en;
      html += '<div class="q-options">' +
        opts.map((o, i) => `<button class="q-opt" data-i="${i}">${o}</button>`).join('') +
        '</div>';
    } else if (q.type === 'truefalse') {
      html += `<div class="q-options">
        <button class="q-opt" data-tf="true">✔ ${({en:'True',fr:'Vrai',de:'Richtig',ru:'Правда'})[lang]}</button>
        <button class="q-opt" data-tf="false">✘ ${({en:'False',fr:'Faux',de:'Falsch',ru:'Ложь'})[lang]}</button>
      </div>`;
    } else if (q.type === 'input') {
      html += `<input class="q-input" id="q-input" placeholder="Wpisz odpowiedź…" autocomplete="off">
        <div style="margin-top:10px; display:flex; gap:8px">
          <button class="btn btn-accent" id="q-submit">Sprawdź</button>
          <button class="btn btn-sm" id="q-hint">💡 Podpowiedź (−50 🪙)</button>
        </div>`;
    }
    html += '</div>';
    body.innerHTML = html;

    document.getElementById('q-tts').onclick = () => EW.speech.speak(prompt, lang);

    if (q.type === 'choice') {
      body.querySelectorAll('.q-opt').forEach(btn => {
        btn.onclick = () => {
          const ok = parseInt(btn.dataset.i) === q.correct;
          btn.classList.add(ok ? 'correct' : 'wrong');
          if (!ok) body.querySelector(`[data-i="${q.correct}"]`)?.classList.add('correct');
          setTimeout(() => answered(p, ok), 750);
        };
      });
    } else if (q.type === 'truefalse') {
      body.querySelectorAll('.q-opt').forEach(btn => {
        btn.onclick = () => {
          const ok = (btn.dataset.tf === 'true') === q.correct;
          btn.classList.add(ok ? 'correct' : 'wrong');
          setTimeout(() => answered(p, ok), 750);
        };
      });
    } else if (q.type === 'input') {
      const input = document.getElementById('q-input');
      input.focus();
      const check = () => {
        const expected = (q.answer[lang] || q.answer.en || '').toLowerCase();
        const variants = expected.split('|').map(s => s.trim());
        const given = EW.speech.normalize(input.value);
        const ok = variants.some(v => given === EW.speech.normalize(v));
        input.style.borderColor = ok ? 'var(--green)' : 'var(--red)';
        setTimeout(() => answered(p, ok), 650);
      };
      document.getElementById('q-submit').onclick = check;
      input.onkeydown = e => { if (e.key === 'Enter') check(); };
      document.getElementById('q-hint').onclick = () => {
        if (EW.state.player.coins < 50) { EW.toast('⚡ Za mało coins na podpowiedź.', 'warn'); return; }
        EW.addCoins(-50, 'podpowiedź słowa');
        const ans = (q.answer[lang] || q.answer.en).split('|')[0];
        EW.toast(`💡 Zaczyna się na: <b>${ans.slice(0, Math.ceil(ans.length / 2))}…</b> (${ans.length} liter)`);
        EW.ui.updateHud();
      };
    }
  }

  function answered(p, ok) {
    if (ok) {
      qCorrect++;
      EW.addCoins(40, 'poprawna odpowiedź');
      EW.addEnergy(10);
      EW.toast('✅ Poprawna odpowiedź! +40 🪙 +10 ⚡', 'good');
      qIndex++;
      if (qIndex >= p.questions.length) completeMission(p);
      else renderQuestion(p);
    } else {
      failMission(p);
    }
    EW.ui.updateHud();
  }

  /* ══════════ SUKCES ══════════ */
  function completeMission(p) {
    const st = EW.state, r = p.rewards || {};
    st.player.completed.push(p.id);
    delete st.player.distanceTaskProgress[p.id];

    EW.addCoins((r.coins || 0) + (p.questions?.length ? 0 : 0), `misja „${p.name}”`);
    EW.addEnergy(r.energy || 0);
    EW.addXp(r.xp || 0);

    const rewardsHtml = [];
    if (r.coins) rewardsHtml.push(`🪙 +${r.coins}`);
    if (r.energy) rewardsHtml.push(`⚡ +${r.energy}`);
    if (r.xp) rewardsHtml.push(`✨ +${r.xp} XP`);

    if (r.item) {
      st.player.inventory[r.item] = (st.player.inventory[r.item] || 0) + 1;
      const item = EW.SHOP.flatMap(s => s.items).find(i => i.id === r.item);
      rewardsHtml.push(`${item ? item.icon + ' ' + item.name : r.item}`);
    }

    if (r.words) {
      for (const w of r.words) {
        const id = `word-${p.id}-${w.pl}`;
        if (!st.player.notebook.find(n => n.id === id)) {
          st.player.notebook.push({
            id, target: w.target, pl: w.pl, lang: st.player.lang,
            added: Date.now(), reps: 0, nextReview: Date.now(), mastered: false, fav: false,
          });
          EW.addCoins(20, `nowe słowo „${w.pl}”`);
          rewardsHtml.push(`📖 ${EW.t(w.target)}`);
        }
      }
    }

    if (p.type === 'artifact') {
      st.player.artifacts.push({ id: p.id, name: p.name, rarity: p.rarity || 'common', date: Date.now() });
      if (p.rarity === 'legendary') EW.toast('💠 LEGENDARNY ARTEFAKT!', 'good');
    }

    if (r.story) {
      st.player.story.push({ title: r.story.title, textPl: r.story.textPl, date: Date.now() });
    }

    if (p.unlocks) {
      for (const uid of p.unlocks) {
        if (!st.player.unlockedPoints.includes(uid)) {
          st.player.unlockedPoints.push(uid);
          const up = EW.getPoint(uid);
          if (up) EW.toast(`📡 Nowy sygnał na mapie: <b>${up.name}</b>!`, 'good');
        }
      }
    }

    if (r.unlocksChapter && !st.player.unlockedChapters.includes(r.unlocksChapter)) {
      st.player.unlockedChapters.push(r.unlocksChapter);
      st.player.chapter = r.unlocksChapter;
      EW.addCoins(1000, 'ukończenie rozdziału');
      if (st.player.translationsUsed === 0) {
        EW.addCoins(700, 'rozdział bez tłumaczeń');
        EW.toast('🧠 Rozdział bez użycia tłumaczenia! +700 🪙', 'good');
      }
      rewardsHtml.push('🌀 Nowy rozdział!');
    }

    EW.log(`Ukończono: „${p.name}” (${p.type})`);
    EW.checkAchievements();
    EW.save();
    EW.map.refreshPlayerMarkers();
    hideActivateFab(); activePointId = null;

    // ekran wyniku
    const body = document.getElementById('mm-body');
    const foot = document.getElementById('mm-foot');
    body.innerHTML = `
      <div class="result-banner ok">
        <span class="ri">🎉</span>
        <h3>Misja zaliczona!</h3>
        <p class="muted">${r.story ? r.story.textPl : 'Kolejny fragment historii odblokowany.'}</p>
        <div class="result-rewards">${rewardsHtml.map(x => `<span>${x}</span>`).join('')}</div>
      </div>`;
    foot.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'btn btn-accent';
    btn.textContent = 'Wracam na mapę';
    btn.onclick = closeMission;
    foot.appendChild(btn);
  }

  /* ══════════ PORAŻKA ══════════ */
  function failMission(p) {
    const st = EW.state;
    const pen = p.penalty || { hp: 10, coins: 20 };

    // tarcza ochronna ratuje przed utratą HP
    let shieldUsed = false;
    if (pen.hp && st.player.inventory.shield > 0) {
      st.player.inventory.shield--;
      shieldUsed = true;
    } else if (pen.hp) {
      EW.addHp(-pen.hp);
    }
    if (pen.coins) EW.addCoins(-pen.coins, 'kara za błąd');

    let vanishMsg = '';
    if (p.vanishOnFail) {
      st.player.failed.push(p.id);
      st.player.mustReturnToSafeZone = true;
      if (p.relocateOnFail) {
        // magiczny trop — pojawi się w innym miejscu (300–600 m od centrum)
        const c = st.campaign.meta.center;
        const ang = Math.random() * Math.PI * 2;
        const dist = 300 + Math.random() * 300;
        st.player.relocated[p.id] = {
          lat: c.lat + (Math.cos(ang) * dist) / 111320,
          lng: c.lng + (Math.sin(ang) * dist) / (111320 * Math.cos(c.lat * Math.PI / 180)),
        };
      }
      vanishMsg = 'Trop był magiczny — <b>zniknął</b> i pojawi się w innym miejscu. Wróć do <b>bezpiecznej strefy</b> po nowe wytyczne!';
    }

    EW.log(`Porażka: „${p.name}” (−${pen.hp || 0} HP, −${pen.coins || 0} coins)`);
    EW.save();
    EW.map.refreshPlayerMarkers();
    hideActivateFab(); activePointId = null;

    const body = document.getElementById('mm-body');
    const foot = document.getElementById('mm-foot');
    body.innerHTML = `
      <div class="result-banner fail">
        <span class="ri">💥</span>
        <h3>Misja nieudana!</h3>
        <p class="muted">Obcy przechwycili sygnał. ${vanishMsg}</p>
        <div class="result-rewards">
          ${shieldUsed ? '<span>🛡️ Tarcza pochłonęła obrażenia</span>' : (pen.hp ? `<span>❤️ −${pen.hp} HP</span>` : '')}
          ${pen.coins ? `<span>🪙 −${pen.coins}</span>` : ''}
        </div>
      </div>`;
    foot.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'btn btn-danger';
    btn.textContent = st.player.mustReturnToSafeZone ? '🛡️ Biegnę do bezpiecznej strefy' : 'Spróbuję jeszcze raz';
    btn.onclick = closeMission;
    foot.appendChild(btn);

    if (st.player.hp <= 0) {
      EW.toast('☠️ Zdrowie na zerze! Użyj apteczki albo odpocznij w bezpiecznej strefie.', 'bad');
    }
  }

  /* ══════════ SKLEP / EKWIPUNEK ══════════ */
  function buyItem(id) {
    const st = EW.state;
    const item = EW.SHOP.flatMap(s => s.items).find(i => i.id === id);
    if (!item) return;
    if (item.passive) { EW.toast('ℹ️ Ten zakup działa kontekstowo — użyjesz go podczas czytania i misji.'); return; }
    if (st.player.coins < item.price) {
      EW.toast('⚡ Za mało coins! Zdobądź więcej Lingua Energy — ruszaj się i ucz.', 'warn');
      return;
    }
    EW.addCoins(-item.price, `zakup: ${item.name}`);
    st.player.inventory[id] = (st.player.inventory[id] || 0) + 1;
    EW.toast(`${item.icon} Kupiono: <b>${item.name}</b>`, 'good');
    EW.save(); EW.ui.updateHud(); EW.ui.renderShop(); EW.ui.renderInventory();
  }

  function useItem(id) {
    const st = EW.state;
    if (!(st.player.inventory[id] > 0)) return;
    if (id === 'medkit') {
      if (st.player.hp >= 100) { EW.toast('❤️ Masz pełne zdrowie.'); return; }
      st.player.inventory[id]--;
      EW.addHp(50);
      EW.toast('⛑️ Apteczka użyta: +50 HP', 'good');
    } else {
      EW.toast('ℹ️ Ten przedmiot działa pasywnie lub podczas misji.');
    }
    EW.save(); EW.ui.updateHud(); EW.ui.renderInventory();
  }

  /* ══════════ POWTÓRKI (nauka zdań) ══════════ */
  const REVIEW_REWARDS = [200, 250, 400];
  const REVIEW_INTERVALS = [1, 7, 30]; // dni

  function dueNotes() {
    const now = Date.now();
    return EW.state.player.notebook.filter(n => !n.mastered && n.nextReview <= now);
  }

  function startReview() {
    const due = dueNotes();
    if (!due.length) {
      EW.toast('✅ Brak zdań do powtórki. Zbieraj nowe z pamiętników!');
      return;
    }
    reviewNote(due[0]);
  }

  function reviewNote(n) {
    const st = EW.state, lang = st.player.lang;
    const target = n.target[lang] || n.target.en;

    document.getElementById('mm-type').textContent = 'Powtórka — Lingua Energy';
    document.getElementById('mm-title').textContent = '🎯 Powiedz to w języku nauki';
    const body = document.getElementById('mm-body');
    const foot = document.getElementById('mm-foot');

    body.innerHTML = `
      <div class="question-block">
        <div class="q-progress">POWTÓRKA ${n.reps + 1}/3 · nagroda: +${REVIEW_REWARDS[Math.min(n.reps, 2)]} 🪙</div>
        <div class="q-prompt">🇵🇱 „${n.pl}”</div>
        <p class="muted small" style="margin-bottom:10px">Wpisz lub wypowiedz zdanie w języku: <b>${EW.LANGS[lang].flag} ${EW.LANGS[lang].name}</b></p>
        <input class="q-input" id="rev-input" placeholder="Wpisz zdanie…" autocomplete="off">
        <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap">
          <button class="btn btn-accent" id="rev-check">Sprawdź</button>
          ${EW.speech.srAvailable ? '<button class="btn" id="rev-speak">🎤 Powiedz na głos</button>' : ''}
          <button class="btn btn-sm" id="rev-listen">🔊 Podpowiedź audio (−20 🪙)</button>
        </div>
        <div id="rev-result" style="margin-top:14px"></div>
      </div>`;
    foot.innerHTML = '<button class="btn" id="rev-close">Zakończ powtórkę</button>';
    document.getElementById('rev-close').onclick = closeMission;
    document.getElementById('mission-modal').classList.remove('hidden');

    const grade = (text) => {
      const sim = EW.speech.similarity(target, text);
      const pct = Math.round(sim * 100);
      const resEl = document.getElementById('rev-result');
      if (sim >= 0.75) {
        const reward = REVIEW_REWARDS[Math.min(n.reps, 2)];
        n.reps++;
        n.nextReview = Date.now() + REVIEW_INTERVALS[Math.min(n.reps - 1, 2)] * 86400000;
        if (n.reps >= 3) n.mastered = true;
        EW.addCoins(reward, 'zdanie z pamięci');
        EW.addEnergy(30);
        resEl.innerHTML = `<div class="result-banner ok"><h3>✅ ${pct}% zgodności!</h3>
          <p class="muted">+${reward} 🪙 +30 ⚡ ${n.mastered ? '· ⭐ Zdanie OPANOWANE!' : `· następna powtórka za ${REVIEW_INTERVALS[Math.min(n.reps - 1, 2)]} dni`}</p>
          <p class="muted small">Wzór: „${target}”</p></div>`;
        EW.checkAchievements(); EW.save(); EW.ui.updateHud();
        const next = dueNotes()[0];
        if (next) {
          const b = document.createElement('button');
          b.className = 'btn btn-accent'; b.textContent = '→ Następne zdanie';
          b.onclick = () => reviewNote(next);
          resEl.querySelector('.result-banner').appendChild(b);
        }
      } else {
        resEl.innerHTML = `<div class="result-banner fail"><h3>❌ Tylko ${pct}% zgodności</h3>
          <p class="muted">Wzór: „${target}”. Posłuchaj i spróbuj ponownie!</p></div>`;
      }
    };

    document.getElementById('rev-check').onclick = () => grade(document.getElementById('rev-input').value);
    document.getElementById('rev-input').onkeydown = e => { if (e.key === 'Enter') grade(e.target.value); };
    document.getElementById('rev-listen').onclick = () => {
      if (st.player.coins < 20) { EW.toast('⚡ Za mało coins.', 'warn'); return; }
      EW.addCoins(-20, 'wolniejsze nagranie');
      const r = EW.speech.getRate(); EW.speech.setRate(0.5);
      EW.speech.speak(target, lang);
      setTimeout(() => EW.speech.setRate(r), 100);
      EW.ui.updateHud();
    };
    const speakBtn = document.getElementById('rev-speak');
    if (speakBtn) speakBtn.onclick = () => {
      speakBtn.textContent = '🎤 Słucham…';
      EW.speech.listen(lang, alts => {
        speakBtn.textContent = '🎤 Powiedz na głos';
        document.getElementById('rev-input').value = alts[0] || '';
        // wybierz najlepszą z alternatyw
        let best = alts[0] || '';
        for (const a of alts) if (EW.speech.similarity(target, a) > EW.speech.similarity(target, best)) best = a;
        grade(best);
      }, err => {
        speakBtn.textContent = '🎤 Powiedz na głos';
        EW.toast('⚠️ Rozpoznawanie mowy: ' + err, 'warn');
      });
    };
  }

  EW.game = {
    onMoved, onTick, onPointClicked, activatePoint,
    closeMission, sentenceMenuAction, hideSentenceMenu,
    buyItem, useItem, startReview, dueNotes,
  };
})();
