/**
 * notifyUtil — Envia notificação local via Web Notifications API.
 *
 * Uso em ações de UI (âncora, bloqueio) que não passam pelo fluxo de
 * eventos Traccar. Para eventos Traccar use sendEventNotification do
 * useNotifications hook (já integrado no SocketController).
 *
 * Push para devices com app fechado é gerenciado exclusivamente pelo OneSignal.
 */

import { showNotification, getNotificationPermission } from './notificationManager';

/**
 * Exibe notificação local imediata (apenas device atual).
 *
 * @param {string} title - Título da notificação
 * @param {string} body  - Texto do corpo
 * @param {object} [options]
 * @param {string} [options.tag]  - Tag de deduplicação
 * @param {string} [options.icon] - URL do ícone
 * @param {object} [options.data] - Dados extras (deviceId, etc.)
 * @param {boolean} [options.requireInteraction] - Mantém na tela até interagir
 */
export const sendNotification = (title, body, options = {}) => {
  if (getNotificationPermission() !== 'granted') return;

  showNotification(title, {
    body,
    icon: options.icon || '/pwa-192x192.png',
    tag: options.tag,
    data: options.data || {},
    requireInteraction: options.requireInteraction ?? false,
  });
};
