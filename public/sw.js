// Minimal service worker for iOS PWA standalone mode
// This helps iOS Safari recognize the app as a "real" PWA

const CACHE_NAME = 'ym-app-v1';

// Install event - activate the new worker right away
self.addEventListener('install', () => {
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

// No fetch handler on purpose. A pass-through `respondWith(fetch(...))` cached
// nothing but still routed every request through the worker (startup + proxy
// cost on each navigation and asset). Without one, the browser goes straight
// to the network — same "always fresh" behavior, minus the overhead.
