// Kanvas service worker.
// Strategy: network-first for everything, falling back to cache only when
// offline. A previous version of this app had trouble with fixes not
// appearing to take effect after deploy - that's the classic symptom of a
// cache-first service worker serving a stale app shell. Network-first avoids
// that: as long as the device is online, you always get what's actually on
// GitHub Pages, and the cache only kicks in as an offline fallback.
//
// Bump CACHE_NAME (e.g. 'kanvas-v2') any time you want to force old cached
// entries to be cleared out on the next load.

const CACHE_NAME = 'kanvas-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-512-maskable.png'
];

self.addEventListener('install', function (event) {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names
          .filter(function (name) { return name !== CACHE_NAME; })
          .map(function (name) { return caches.delete(name); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function (event) {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request).then(function (response) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then(function (cache) {
        cache.put(event.request, copy);
      });
      return response;
    }).catch(function () {
      return caches.match(event.request);
    })
  );
});
