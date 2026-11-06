/* Earn With Hatty — Lightweight Service Worker (PWA Shell Caching) */
var CACHE_NAME = 'hatty-shell-v1';
var STATIC_ASSETS = [
  './',
  'index.html',
  'privacy-policy.html',
  'terms.html',
  'favicon.png',
  'favicon.ico',
  'apple-touch-icon.png',
  'grey-hat-nb.png',
  'manifest.json',
  'space_assets/three.min.js'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) {
          return key !== CACHE_NAME;
        }).map(function(key) {
          return caches.delete(key);
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var request = event.request;
  // Ignore non-GET requests or browser extension/cross-origin requests
  if (request.method !== 'GET') return;
  var url = new URL(request.url);

  // For same-origin requests, use network-first with cache fallback
  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(request).then(function(response) {
        // If valid response, update cache
        if (response && response.status === 200 && response.type === 'basic') {
          var responseClone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(request, responseClone);
          });
        }
        return response;
      }).catch(function() {
        return caches.match(request).then(function(cachedResponse) {
          if (cachedResponse) return cachedResponse;
          if (request.mode === 'navigate') {
            return caches.match('index.html');
          }
          return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
        });
      })
    );
  }
});
