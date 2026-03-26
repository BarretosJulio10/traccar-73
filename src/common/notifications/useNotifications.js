/**
 * useNotifications — Hook de notificações do HyperTraccar
 *
 * Combina Web Notifications API (foreground) + OneSignal (background/fechado).
 * A permissão NÃO é solicitada automaticamente — requer ação explícita do usuário.
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../components/LocalizationProvider';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
} from './notificationManager';
import { formatEventNotification, shouldNotify } from './notificationEvents';
import useOneSignal from './useOneSignal';

const useNotifications = () => {
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const [permission, setPermission] = useState(getNotificationPermission);

  const { sendEventPush: oneSignalSendEventPush, isSubscribed: oneSignalSubscribed, subscribe: oneSignalSubscribe, unsubscribe: oneSignalUnsubscribe } = useOneSignal();

  // Sincroniza o estado de permissão com mudanças externas (ex: usuário revoga no sistema)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getNotificationPermission();
      setPermission((prev) => (prev !== current ? current : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

  const sendEventNotification = useCallback(
    (event) => {
      // ── OneSignal: SEMPRE dispara, independente da permissão local ──────────
      // O objetivo do OneSignal é entregar para outros devices (PWA fechado).
      // NÃO deve depender da permissão do browser do device que está fazendo polling.
      oneSignalSendEventPush(event);

      // ── Notificação local: apenas se este device tem permissão ────────────
      if (permission !== 'granted') return;
      if (!shouldNotify(event.type)) return;

      const notification = formatEventNotification(event, devices, t);
      if (!notification) return;

      showNotification(notification.title, {
        body: notification.body,
        icon: notification.icon,
        tag: notification.tag,
        data: notification.data,
        requireInteraction: notification.requireInteraction ?? false,
      });
    },
    [permission, devices, t, oneSignalSendEventPush]
  );

  return {
    supported: isNotificationSupported(),
    permission,
    requestPermission,
    sendEventNotification,
    oneSignalSubscribed,
    oneSignalSubscribe,
    oneSignalUnsubscribe,
  };
};

export default useNotifications;
