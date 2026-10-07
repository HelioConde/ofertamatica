const SW_VERSION = '2026-10-07.1'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Intentionally do not intercept fetch requests yet.
// The previous pass-through fetch handler could reject inside respondWith()
// and log "Uncaught (in promise) TypeError: Failed to fetch" for offline,
// cancelled, ad/analytics or other transient requests. Without a fetch handler,
// the browser handles networking normally while the app remains installable.
