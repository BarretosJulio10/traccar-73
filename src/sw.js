/**
 * Custom Service Worker — HyperTraccar PWA
 *
 * Estratégia: injectManifest (workbox injeta o precache manifest via __WB_MANIFEST)
 * Handles: precaching, SPA navigation, push notifications, notificationclick
 */

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';

// ─── Precache ───────────────────────────────────────────────────────────────
// self.__WB_MANIFEST é substituído pelo vite-plugin-pwa durante o build
precacheAndRoute(self.__WB_MANIFEST || []);
cleanupOutdatedCaches();

// ─── SPA Navigation Fallback ────────────────────────────────────────────────
const handler = createHandlerBoundToURL('/index.html');
const navigationRoute = new NavigationRoute(handler, {
  denylist: [/^\/api/, /^\/~oauth/],
});
registerRoute(navigationRoute);

// ─── Lifecycle ──────────────────────────────────────────────────────────────
self.skipWaiting();
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// ─── Push Notification (app fechado / segundo plano) ────────────────────────
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data?.json() ?? {};
  } catch {
    data = {
      title: 'HyperTraccar',
      body: event.data?.text() ?? 'Nova notificação de rastreamento',
    };
  }

  const title = data.title ?? 'HyperTraccar';
  const options = {
    body: data.body ?? '',
    icon: data.icon ?? '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    tag: data.tag ?? `hypertraccar-${Date.now()}`,
    data: {
      url: data.url ?? '/',
      ...(data.data ?? {}),
    },
    vibrate: [200, 100, 200],
    requireInteraction: data.requireInteraction ?? false,
    silent: false,
    actions: data.actions ?? [],
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// ─── Notification Click — abre/foca o app ao tocar na notificação ────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        // Se o app já está aberto: focar e navegar
        for (const client of windowClients) {
          if ('focus' in client) {
            client.focus();
            if (targetUrl !== '/') {
              client.navigate(targetUrl);
            }
            return;
          }
        }
        // App fechado: abrir nova janela
        if (self.clients.openWindow) {
          return self.clients.openWindow(targetUrl);
        }
      })
  );
});

// ─── Resubscription automática ao mudar a subscription de push ──────────────
self.addEventListener('pushsubscriptionchange', (event) => {
  const oldOptions = event.oldSubscription?.options;
  if (!oldOptions) return;

  event.waitUntil(
    self.registration.pushManager
      .subscribe(oldOptions)
      .then((newSubscription) => {
        // Notifica os clientes abertos para salvar a nova subscription
        return self.clients
          .matchAll({ type: 'window' })
          .then((clients) => {
            clients.forEach((client) => {
              client.postMessage({
                type: 'PUSH_SUBSCRIPTION_CHANGED',
                subscription: newSubscription.toJSON(),
              });
            });
          });
      })
      .catch(() => {
        // Silently fail — user will need to re-subscribe manually
      })
  );
});
