/**
 * ARIA — Service Worker
 * Handles offline asset caching, dynamic fetch intercepting, and background notifications.
 */

const CACHE_NAME = 'aria-cache-v2';

const asset = (path) => new URL(path, self.location).href;

// ── Static Asset Manifest ────────────────────────────────────────

const ASSETS = [
  asset('./index.html'), asset('./offline.html'),
  asset('./styles/main.css'), asset('./styles/components.css'),
  asset('./js/app.js'), asset('./js/gemini.js'), asset('./js/firebase.js'),
  asset('./js/maps.js'), asset('./js/notifications.js'), asset('./js/i18n.js'),
  asset('./js/utils.js'), asset('./js/config.js'),
  asset('./manifest.json'), asset('./icons/icon-192x192.png'), asset('./icons/icon-512x512.png')
];

/**
 * Install Event: Pre-caches the core app shell for offline reliability.
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

/**
 * Activate Event: Performs cache cleanup for stale version persistence.
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/**
 * Fetch Event: Cache-first strategy for speed, with network fallback and offline route handling.
 */
self.addEventListener('fetch', (event) => {
  // Only intercept GET requests for caching
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      // Return from cache if available
      if (cached) return cached;

      // Fallback to network and populate cache dynamically
      return fetch(event.request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((c) => c.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Failure State: Show offline splash page for top-level navigation
          if (event.request.mode === 'navigate') return caches.match(asset('./offline.html'));
          return Response.error();
        });
    })
  );
});

/* ── PWA Notification Lifecycle ──────────────────────────────────── */

/**
 * Receives 'SHOW_NOTIFICATION' messages from the main thread.
 * Enables background alerts even when the UI is closed.
 */
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SHOW_NOTIFICATION') {
    const { title, body, data } = event.data;
    self.registration.showNotification(title, {
      body, icon: '/icons/icon-192x192.png', badge: '/icons/icon-192x192.png',
      vibrate: [200, 100, 200], data
    });
  }
});

/**
 * Handles clicks on notifications, including deep-linking to specific screens.
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const screen = event.notification.data?.screen || 'assistant';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      // Focus existing window if open
      for (const client of list) {
        if ('focus' in client) {
          client.postMessage({ type: 'NAVIGATE', screen });
          return client.focus();
        }
      }
      // Or open a new instance of the PWA
      return clients.openWindow?.(new URL(`./?screen=${screen}`, self.location).href);
    })
  );
});
