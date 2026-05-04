/* eslint-disable no-restricted-globals */
/**
 * ShubhMilan service worker — handles Web Push notifications on the web build.
 *
 * Delivered by the server via the `web-push` library against a PushSubscription
 * the page registered through `navigator.serviceWorker.register('/sw.js')` and
 * `registration.pushManager.subscribe(...)`. Payload shape (JSON):
 *
 *   {
 *     "title": "...",
 *     "body":  "...",
 *     "data":  { "url": "/chat/abc123", "category": "new_message", ... }
 *   }
 *
 * On click we focus an existing tab if one is open, otherwise we open a new
 * window at `data.url` (defaults to the app root).
 */

self.addEventListener('install', (event) => {
  // Activate immediately so subsequent updates take effect on the next page load.
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = { title: 'ShubhMilan', body: 'You have a new notification', data: {} };
  try {
    if (event.data) payload = { ...payload, ...event.data.json() };
  } catch (_err) {
    /* Non-JSON payload — fall through with defaults. */
  }
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon.png',
      badge: '/icon.png',
      data: payload.data || {},
      tag: payload.data?.tag || undefined,
      renotify: !!payload.data?.tag,
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client && targetUrl !== '/') client.navigate(targetUrl);
          return;
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
    }),
  );
});
