const CACHE = 'navigator-v1';
const TILE_CACHE = 'navigator-tiles-v1';
// App shell files to cache immediately
const SHELL = [
  '/GTAV-map/',
  '/GTAV-map/index.html',
  'https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(SHELL))
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
  // Cache map tiles aggressively (they rarely change)
  if (url.hostname.includes('cartocdn.com')) {
    e.respondWith(
      caches.open(TILE_CACHE).then(async cache => {
        const cached = await cache.match(e.request);
        if (cached) return cached;
        const fresh = await fetch(e.request);
        cache.put(e.request, fresh.clone());
        return fresh;
      }).catch(() => caches.match(e.request))
    );
    return;
  }
  // Network-first for everything else (APIs, search, routing)
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
