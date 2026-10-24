/* global self */
self.addEventListener('push', event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { /* Notificação sem payload */ }
  event.waitUntil(self.registration.showNotification('Validade Zero • Vencimentos', {
    body: typeof payload.body === 'string' ? payload.body.slice(0, 220) : 'Há produtos para conferir.',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'validadezero-expiry-' + String(payload.date || '').slice(0, 10),
    renotify: false,
    data: { url: self.registration.scope }
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil((async () => {
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const client of clients) {
      if (client.url.startsWith(self.registration.scope)) { await client.focus(); return; }
    }
    await self.clients.openWindow(self.registration.scope);
  })());
});
