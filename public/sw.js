// Offline cache for Jones Retro Games.
// Strategy: precache the emulator + every game so one online visit makes all
// games playable with no internet (cabin/Starlink insurance). App code and
// pages use network-first so deploys still land; everything else is
// cache-first. Bump CACHE_VERSION when precached files change.

const CACHE_VERSION = 'jrg-v2';

const GAME_IDS = [
  'digger',
  'carmen-sandiego',
  'castle-adventure',
  'snipes',
  'oregon-trail',
  'tetris',
  'kings-quest',
  'frogger',
];

const PRECACHE = [
  '/',
  '/test-jsdos.html',
  '/jsdos/js-dos.js',
  '/jsdos/wdosbox.js',
  '/jsdos/wdosbox.wasm.js',
  ...GAME_IDS.map((id) => `/roms/${id}.zip`),
  ...GAME_IDS.map((id) => `/covers/${id}.png`),
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) =>
      // Add individually so one 404 doesn't sink the whole precache
      Promise.allSettled(PRECACHE.map((url) => cache.add(url)))
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;

  const isNavigation = event.request.mode === 'navigate';
  const isHtml = isNavigation || url.pathname.endsWith('.html');
  const isAppAsset = url.pathname.startsWith('/assets/');

  if (isHtml || isAppAsset) {
    // Network-first: fresh deploys win, cache is the offline fallback
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(event.request)
            .then((hit) => hit ?? (isNavigation ? caches.match('/') : Response.error()))
        )
    );
    return;
  }

  // Everything else (roms, emulator, covers): cache-first
  event.respondWith(
    caches.match(event.request).then(
      (hit) =>
        hit ??
        fetch(event.request).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(event.request, copy));
          }
          return res;
        })
    )
  );
});
