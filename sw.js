const CACHE = 'navigator-v2';
const TILE_CACHE = 'navigator-tiles-v2';
// App shell files to cache immediately
const SHELL = [
  '/GTAV-map/',
  '/GTAV-map/index.html',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.css',
  'https://unpkg.com/maplibre-gl@4.7.1/dist/maplibre-gl.js'
];
self.addEventListener('install', e => {
  // Cache shell items individually so one failure doesn't abort the whole install
  e.waitUntil(
    caches.open(CACHE).then(c => Promise.all(
      SHELL.map(u => c.add(u).catch(() => {}))
    ))
  );
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE && k !== TILE_CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // Cache vector/raster map tiles & glyphs aggressively (they rarely change)
  if (url.hostname.includes('openfreemap.org') || url.hostname.includes('cartocdn.com')) {
    e.respondWith(
      caches.open(TILE_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        if (fresh && fresh.ok) cache.put(e.request, fresh.clone());
        return fresh;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Network-first for everything else (app shell, APIs, search, routing)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
