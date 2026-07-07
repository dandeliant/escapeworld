/* ═══════════ EscapeWorld — Service Worker (PWA) ═══════════
   Precache powłoki aplikacji + cache dynamiczny dla kafelków mapy i czcionek.
   Podbij CACHE_VERSION przy każdej zmianie plików aplikacji. */
const CACHE_VERSION = 'ew-v2';
const RUNTIME = 'ew-runtime-v1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './js/i18n.js',
  './js/data.js',
  './js/state.js',
  './js/speech.js',
  './js/map.js',
  './js/game.js',
  './js/ui-player.js',
  './js/ui-admin.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_VERSION)
      .then(c => c.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION && k !== RUNTIME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;

  // kafelki OSM: najpierw sieć (aktualne mapy), fallback do cache offline
  if (url.hostname.endsWith('tile.openstreetmap.org')) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(e.request, copy));
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // reszta: najpierw cache (szybki start), fallback do sieci + dopisanie do cache
  e.respondWith(
    caches.match(e.request).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res.ok || res.type === 'opaque') {
          const copy = res.clone();
          caches.open(RUNTIME).then(c => c.put(e.request, copy));
        }
        return res;
      });
    })
  );
});
