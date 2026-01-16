// Minimal service worker for iOS PWA standalone mode
// This helps iOS Safari recognize the app as a "real" PWA

const CACHE_NAME = 'ym-app-v1';

// Install event - cache minimal assets
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, no caching (keeps app always fresh)
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
