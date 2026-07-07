/* ═══════════ EscapeWorld — mapa (Leaflet + OpenStreetMap) ═══════════
   Styl Pokemon GO: prawdziwy GPS startuje automatycznie, mapa podąża za
   graczem, a kampania przenosi się w okolicę gracza. Symulacja GPS zostaje
   jako tryb testowy (komputer / brak zgody na lokalizację).
   Warstwa map jest odizolowana — łatwo podmienić na Google Maps / Mapbox. */
window.EW = window.EW || {};

(function () {
  const TILES = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

  let map = null;            // mapa gracza
  let adminMap = null;       // mapa admina
  let playerMarker = null;
  let accuracyCircle = null; // okrąg dokładności GPS
  let markers = {};          // id -> L.marker (gracz)
  let radiusCircles = {};
  let adminMarkers = {};     // id -> L.marker (admin)

  /* ── ruch/symulacja ── */
  const sim = {
    enabled: true,
    target: null,       // {lat,lng} cel marszu po kliknięciu mapy
    dir: null,          // kierunek z d-pada
    speedKmh: 5,
  };
  const gps = {
    active: false,
    follow: true,       // mapa podąża za graczem
    accuracy: null,
    hadFirstFix: false,
    denied: false,
  };
  let currentSpeed = 0; // km/h (sym lub GPS)
  let gpsWatchId = null;
  let lastFix = null;   // {lat,lng,time} do liczenia prędkości z GPS
  let tickTimer = null;

  /* ── geometria ── */
  function haversine(a, b) {
    const R = 6371000, rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const s = Math.sin(dLat / 2) ** 2 +
      Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(s));
  }

  function moveToward(from, to, meters) {
    const d = haversine(from, to);
    if (d <= meters) return { ...to };
    const f = meters / d;
    return { lat: from.lat + (to.lat - from.lat) * f, lng: from.lng + (to.lng - from.lng) * f };
  }

  /* ── ikony ── */
  function pointIcon(p, done) {
    const t = EW.POINT_TYPES[p.type] || EW.POINT_TYPES.mission;
    return L.divIcon({
      className: 'ew-marker',
      html: `<div class="marker-dot ${done ? 'done' : ''}" style="--c:${t.color}">${t.icon}</div>`,
      iconSize: [38, 38], iconAnchor: [19, 19],
    });
  }
  const playerIcon = L.divIcon({
    className: 'ew-marker',
    html: '<div class="marker-player"></div>',
    iconSize: [22, 22], iconAnchor: [11, 11],
  });

  /* ══════════ MAPA GRACZA ══════════ */
  function initPlayerMap() {
    if (map) { map.invalidateSize(); return; }
    const c = EW.state.player.pos;
    map = L.map('map', { zoomControl: true }).setView([c.lat, c.lng], 16);
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(map);

    playerMarker = L.marker([c.lat, c.lng], { icon: playerIcon, zIndexOffset: 1000 }).addTo(map);
    accuracyCircle = L.circle([c.lat, c.lng], {
      radius: 0, color: '#00e5ff', weight: 1, opacity: 0.4,
      fillColor: '#00e5ff', fillOpacity: 0.08, interactive: false,
    }).addTo(map);

    // przeciągnięcie mapy = wyłącz śledzenie (przycisk 🎯 przywraca)
    map.on('dragstart', () => setFollow(false));

    map.on('click', e => {
      if (!sim.enabled) return;
      sim.target = { lat: e.latlng.lat, lng: e.latlng.lng };
      sim.dir = null;
      EW.toast('🚶 Ruszasz w wybrane miejsce…');
    });

    refreshPlayerMarkers();
    startTick();

    // styl Pokemon GO: od razu próbujemy prawdziwego GPS
    if (!gps.denied) tryStartGps();
  }

  function refreshPlayerMarkers() {
    if (!map) return;
    const st = EW.state;
    for (const id in markers) { map.removeLayer(markers[id]); delete markers[id]; }
    for (const id in radiusCircles) { map.removeLayer(radiusCircles[id]); delete radiusCircles[id]; }

    for (const p of st.campaign.points) {
      if (!EW.isPointVisible(p)) continue;
      const pos = EW.pointPos(p);
      const done = EW.isPointCompleted(p);
      const t = EW.POINT_TYPES[p.type];
      const m = L.marker([pos.lat, pos.lng], { icon: pointIcon(p, done) }).addTo(map);
      m.bindPopup(`<b>${t.icon} ${p.name}</b><br><span style="color:#7f93ad">${t.name}${p.rarity ? ' · ' + EW.RARITIES[p.rarity].name : ''}</span>${done ? '<br>✅ Ukończono' : ''}`);
      m.on('click', () => { EW.game.onPointClicked(p.id); });
      markers[p.id] = m;
      if (!done) {
        radiusCircles[p.id] = L.circle([pos.lat, pos.lng], {
          radius: p.radius || 50, color: t.color, weight: 1, opacity: 0.35,
          fillColor: t.color, fillOpacity: 0.07,
        }).addTo(map);
      }
    }
    updatePlayerMarker();
  }

  function updatePlayerMarker() {
    if (!playerMarker) return;
    const p = EW.state.player.pos;
    playerMarker.setLatLng([p.lat, p.lng]);
    if (accuracyCircle) {
      accuracyCircle.setLatLng([p.lat, p.lng]);
      accuracyCircle.setRadius(gps.active && gps.accuracy ? gps.accuracy : 0);
    }
    if (gps.follow && map) map.panTo([p.lat, p.lng], { animate: true, duration: 0.4 });
  }

  function setFollow(on) {
    gps.follow = on;
    const btn = document.getElementById('btn-recenter');
    if (btn) btn.classList.toggle('following', on);
    if (on) updatePlayerMarker();
  }

  function centerOnPlayer() {
    setFollow(true);
    if (map) map.setView([EW.state.player.pos.lat, EW.state.player.pos.lng], Math.max(map.getZoom(), 16));
  }

  /* ══════════ PĘTLA RUCHU (co 500 ms) ══════════ */
  function startTick() {
    if (tickTimer) return;
    tickTimer = setInterval(tick, 500);
  }

  function tick() {
    const st = EW.state;
    if (!st.player.pos) return;

    if (sim.enabled) {
      let moved = 0;
      const step = (sim.speedKmh * 1000 / 3600) * 0.5; // metry na tick
      if (sim.dir) {
        const dLat = step / 111320;
        const dLng = step / (111320 * Math.cos(st.player.pos.lat * Math.PI / 180));
        const np = { ...st.player.pos };
        if (sim.dir === 'up') np.lat += dLat;
        if (sim.dir === 'down') np.lat -= dLat;
        if (sim.dir === 'left') np.lng -= dLng;
        if (sim.dir === 'right') np.lng += dLng;
        moved = haversine(st.player.pos, np);
        st.player.pos = np;
      } else if (sim.target) {
        const np = moveToward(st.player.pos, sim.target, step);
        moved = haversine(st.player.pos, np);
        st.player.pos = np;
        if (haversine(np, sim.target) < 1) { sim.target = null; EW.toast('📍 Dotarłeś na miejsce.'); }
      }
      currentSpeed = moved > 0 ? sim.speedKmh : 0;
      if (moved > 0) { EW.game.onMoved(moved); updatePlayerMarker(); }
    }

    EW.game.onTick();
  }

  /* ══════════ PRAWDZIWY GPS (domyślny, styl Pokemon GO) ══════════ */
  function tryStartGps() {
    if (gps.active) return;
    if (!navigator.geolocation) {
      EW.ui.setGpsStatus(false, 'brak wsparcia');
      return;
    }
    EW.ui.setGpsStatus(null); // "łączenie…"
    sim.enabled = false; sim.target = null; sim.dir = null;

    gpsWatchId = navigator.geolocation.watchPosition(fix => {
      const np = { lat: fix.coords.latitude, lng: fix.coords.longitude };
      const now = Date.now();
      gps.active = true;
      gps.accuracy = fix.coords.accuracy || null;

      if (!gps.hadFirstFix) {
        gps.hadFirstFix = true;
        lastFix = { ...np, time: now };
        EW.state.player.pos = np;
        EW.ui.setGpsStatus(true);
        setFollow(true);
        if (map) map.setView([np.lat, np.lng], 17);
        EW.toast('🛰️ Znaleziono Cię na mapie!', 'good');
        // misje daleko od gracza? zaproponuj przeniesienie kampanii tutaj
        const d = haversine(np, EW.state.campaign.meta.center);
        if (d > 1500) EW.ui.offerRelocation(Math.round(d));
      } else {
        const d = haversine(lastFix, np);
        const dt = (now - lastFix.time) / 1000;
        if (dt > 0) currentSpeed = (d / dt) * 3.6;
        // filtr szumu GPS: licz dystans dopiero od ~2 m przesunięcia
        if (d > 2) {
          EW.game.onMoved(d);
          lastFix = { ...np, time: now };
          EW.state.player.pos = np;
        }
      }
      updatePlayerMarker();
    }, err => {
      gps.denied = err.code === 1; // PERMISSION_DENIED
      stopGps();
      EW.ui.setGpsStatus(false, gps.denied ? 'brak zgody' : err.message);
      EW.toast(gps.denied
        ? '📵 Brak zgody na lokalizację — gram w trybie symulacji. Włącz lokalizację i kliknij 🛰️, aby grać w terenie.'
        : '⚠️ Błąd GPS: ' + err.message + ' — przechodzę do symulacji.', 'warn');
    }, { enableHighAccuracy: true, maximumAge: 2000, timeout: 15000 });
  }

  function stopGps() {
    if (gpsWatchId != null) navigator.geolocation.clearWatch(gpsWatchId);
    gpsWatchId = null; lastFix = null;
    gps.active = false; gps.hadFirstFix = false; gps.accuracy = null;
    currentSpeed = 0;
    sim.enabled = true;
    updatePlayerMarker();
  }

  /* Przenosi całą kampanię (punkty + centrum) w okolicę gracza,
     zachowując wzajemny układ punktów. */
  function relocateCampaignTo(lat, lng) {
    const st = EW.state;
    const dLat = lat - st.campaign.meta.center.lat;
    const dLng = lng - st.campaign.meta.center.lng;
    st.campaign.meta.center = { lat, lng };
    for (const p of st.campaign.points) { p.lat += dLat; p.lng += dLng; }
    for (const id in st.player.relocated) {
      st.player.relocated[id].lat += dLat;
      st.player.relocated[id].lng += dLng;
    }
    EW.save();
    refreshPlayerMarkers();
    refreshAdminMarkers();
    EW.log('Kampania przeniesiona w okolicę gracza');
    EW.toast('🌍 Misje przeniesione w Twoją okolicę. Powodzenia, agencie!', 'good');
  }

  /* ══════════ MAPA ADMINA ══════════ */
  function initAdminMap() {
    if (adminMap) { adminMap.invalidateSize(); refreshAdminMarkers(); return; }
    const c = EW.state.campaign.meta.center;
    adminMap = L.map('admin-map').setView([c.lat, c.lng], 15);
    L.tileLayer(TILES, { attribution: ATTR, maxZoom: 19 }).addTo(adminMap);

    adminMap.on('click', e => {
      EW.admin.addPointAt(e.latlng.lat, e.latlng.lng);
    });
    refreshAdminMarkers();
  }

  function refreshAdminMarkers() {
    if (!adminMap) return;
    for (const id in adminMarkers) { adminMap.removeLayer(adminMarkers[id]); delete adminMarkers[id]; }
    for (const p of EW.state.campaign.points) {
      const t = EW.POINT_TYPES[p.type];
      const m = L.marker([p.lat, p.lng], { icon: pointIcon(p, false), draggable: true }).addTo(adminMap);
      m.bindTooltip(`${t.icon} ${p.name}${p.hidden ? ' (ukryty)' : ''}`);
      m.on('dragend', () => {
        const ll = m.getLatLng();
        p.lat = ll.lat; p.lng = ll.lng;
        EW.save();
        EW.admin.renderPointsList();
        EW.toast(`📍 Przeniesiono „${p.name}”`);
      });
      m.on('click', () => EW.admin.selectPoint(p.id));
      adminMarkers[p.id] = m;
    }
  }

  function adminPanTo(p) { if (adminMap) adminMap.panTo([p.lat, p.lng]); }
  function adminCenter() {
    return adminMap ? adminMap.getCenter() : EW.state.campaign.meta.center;
  }

  EW.map = {
    initPlayerMap, refreshPlayerMarkers, updatePlayerMarker, centerOnPlayer,
    initAdminMap, refreshAdminMarkers, adminPanTo, adminCenter,
    haversine,
    sim,
    getSpeed: () => currentSpeed,
    setSimSpeed: v => { sim.speedKmh = v; },
    setSimDir: d => { sim.dir = d === 'stop' ? null : d; if (d === 'stop') sim.target = null; },
    tryStartGps, stopGps, setFollow,
    relocateCampaignTo,
    isSim: () => sim.enabled,
    isGpsActive: () => gps.active,
    invalidate: () => { if (map) map.invalidateSize(); if (adminMap) adminMap.invalidateSize(); },
  };
})();
