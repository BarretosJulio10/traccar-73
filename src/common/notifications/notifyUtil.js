/**
 * notifyUtil — Envia notificação local + push server em uma chamada.
 *
 * Uso em ações de UI (âncora, bloqueio) que não passam pelo fluxo de
 * eventos Traccar. Para eventos Traccar use sendEventNotification do
 * useNotifications hook (já integrado no SocketController).
 */

import { showNotification, getNotificationPermission } from './notificationManager';
import { supabase } from '../../integrations/supabase/client';
import { DEFAULT_TENANT_SLUG } from '../util/constants';

/**
 * Envia notificação local imediata + push servidor (para devices com app fechado).
 *
 * @param {string} title - Título da notificação
 * @param {string} body  - Texto do corpo
 * @param {object} [options]
 * @param {string} [options.tag]  - Tag de deduplicação
 * @param {string} [options.icon] - URL do ícone
 * @param {string} [options.url]  - URL de destino ao clicar
 * @param {object} [options.data] - Dados extras (deviceId, etc.)
 * @param {boolean} [options.requireInteraction] - Mantém na tela até interagir
 */
export const sendNotification = (title, body, options = {}) => {
  if (getNotificationPermission() !== 'granted') return;

  // 1. Notificação local via Service Worker (funciona com app aberto)
  showNotification(title, {
    body,
    icon: options.icon || '/pwa-192x192.png',
    tag: options.tag,
    data: options.data || {},
    requireInteraction: options.requireInteraction ?? false,
  });

  // 2. Push servidor — entrega para todos os devices do tenant com app FECHADO
  const tenantId = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
  supabase.functions.invoke('send-push', {
    body: {
      tenant_id: tenantId,
      title,
      body,
      icon: options.icon || '/pwa-192x192.png',
      tag: options.tag || `notify-${Date.now()}`,
      url: options.url || '/app',
      data: options.data || {},
      requireInteraction: options.requireInteraction ?? false,
    },
  }).catch(() => {}); // não-crítico — notificação local já foi exibida
};
