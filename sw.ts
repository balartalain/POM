/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

declare const self: ServiceWorkerGlobalScope;

clientsClaim();
cleanupOutdatedCaches();
precacheAndRoute(self.__WB_MANIFEST);

const PENDING_CACHE = 'pame-pending-updates-v1';
const PENDING_KEY = 'updates';

async function getPending(): Promise<string[]> {
  const cache = await caches.open(PENDING_CACHE);
  const res = await cache.match(PENDING_KEY);
  return res ? (res.json() as Promise<string[]>) : [];
}

async function addPending(type: string): Promise<void> {
  const cache = await caches.open(PENDING_CACHE);
  const updates = await getPending();
  if (!updates.includes(type)) {
    updates.push(type);
    await cache.put(PENDING_KEY, new Response(JSON.stringify(updates), {
      headers: { 'Content-Type': 'application/json' },
    }));
  }
}

async function clearPending(): Promise<void> {
  const cache = await caches.open(PENDING_CACHE);
  await cache.delete(PENDING_KEY);
}

// Recibe notificaciones push del backend (funciona aunque la app esté cerrada)
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: { type: string; title?: string; body?: string };
  try {
    payload = event.data.json() as { type: string; title?: string; body?: string };
  } catch {
    return;
  }

  const { type, title = 'PAME', body = 'Hay datos actualizados disponibles' } = payload;

  event.waitUntil(
    Promise.all([
      addPending(type),
      self.registration.showNotification(title, {
        body,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: type,
        data: { type },
      }),
    ])
  );
});

// Al hacer click en la notificación, abre o enfoca la app
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return (client as WindowClient).focus();
      }
      return self.clients.openWindow('/');
    })
  );
});

// Mensajes desde React
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'GET_PENDING_UPDATES') {
    event.waitUntil(
      getPending().then((updates) => {
        event.ports?.[0]?.postMessage({ updates });
        return clearPending();
      })
    );
  }
});
