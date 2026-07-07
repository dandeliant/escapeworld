/* ═══════════ EscapeWorld — Text-to-Speech i rozpoznawanie mowy ═══════════ */
window.EW = window.EW || {};

(function () {
  const synth = window.speechSynthesis;
  let voices = [];
  let rate = 1.0;

  function refreshVoices() { if (synth) voices = synth.getVoices(); }
  if (synth) {
    refreshVoices();
    synth.onvoiceschanged = refreshVoices;
  }

  /* Znajdź głosy pasujące do języka nauki (np. en → en-GB + en-US) */
  function voicesFor(lang) {
    const prefixes = EW.LANGS[lang].tts.map(c => c.toLowerCase());
    const exact = voices.filter(v => prefixes.some(p => v.lang.toLowerCase().startsWith(p)));
    if (exact.length) return exact;
    return voices.filter(v => v.lang.toLowerCase().startsWith(lang));
  }

  function speak(text, lang, voiceURI) {
    if (!synth) { EW.toast('⚠️ Twoja przeglądarka nie wspiera syntezatora mowy (TTS).', 'warn'); return; }
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const cands = voicesFor(lang || EW.state.player.lang);
    const v = voiceURI ? voices.find(x => x.voiceURI === voiceURI) : cands[0];
    if (v) u.voice = v;
    u.lang = (v && v.lang) || EW.LANGS[lang || EW.state.player.lang].tts[0];
    u.rate = rate;
    synth.speak(u);
  }

  function setRate(r) { rate = r; }
  function getRate() { return rate; }
  function stop() { if (synth) synth.cancel(); }

  /* ── Rozpoznawanie mowy ── */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

  function listen(lang, onResult, onError) {
    if (!SR) { onError('unsupported'); return null; }
    const rec = new SR();
    rec.lang = EW.LANGS[lang].tts[0];
    rec.interimResults = false;
    rec.maxAlternatives = 3;
    rec.onresult = e => {
      const alts = [];
      for (let i = 0; i < e.results[0].length; i++) alts.push(e.results[0][i].transcript);
      onResult(alts);
    };
    rec.onerror = e => onError(e.error);
    rec.start();
    return rec;
  }

  /* Proste podobieństwo tekstów: pokrycie słów + kolejność (0..1).
     W MVP wystarcza do oceny wypowiedzi i odpowiedzi pisemnych. */
  function normalize(s) {
    return s.toLowerCase()
      .replace(/[.,!?;:„”"«»'’()\-–—]/g, ' ')
      .replace(/\s+/g, ' ').trim();
  }

  function similarity(expected, actual) {
    const a = normalize(expected).split(' ').filter(Boolean);
    const b = normalize(actual).split(' ').filter(Boolean);
    if (!a.length || !b.length) return 0;
    const bSet = new Set(b);
    let hit = 0;
    for (const w of a) if (bSet.has(w)) hit++;
    const coverage = hit / a.length;
    // bonus za kolejność: najdłuższy wspólny podciąg
    let lcs = 0, prev = new Array(b.length + 1).fill(0);
    for (let i = 1; i <= a.length; i++) {
      const cur = new Array(b.length + 1).fill(0);
      for (let j = 1; j <= b.length; j++) {
        cur[j] = a[i - 1] === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], cur[j - 1]);
      }
      prev = cur;
    }
    lcs = prev[b.length] / a.length;
    return coverage * 0.6 + lcs * 0.4;
  }

  EW.speech = {
    speak, stop, setRate, getRate, voicesFor, listen, similarity, normalize,
    ttsAvailable: !!synth,
    srAvailable: !!SR,
  };
})();
