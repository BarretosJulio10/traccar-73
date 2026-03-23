/**
 * useNotifications — Hook de notificações do HyperTraccar
 *
 * Combina Web Notifications API (foreground) + Web Push API (background/fechado).
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
import usePushSubscription from './usePushSubscription';

const useNotifications = () => {
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const [permission, setPermission] = useState(getNotificationPermission);

  const pushSubscription = usePushSubscription();

  // Sincroniza o estado de permissão com mudanças externas (ex: usuário revoga no sistema)
  useEffect(() => {
    const interval = setInterval(() => {
      const current = getNotificationPermission();
      setPermission((prev) => (prev !== current ? current : prev));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Após conceder permissão, inscreve automaticamente no Web Push (se suportado)
  useEffect(() => {
    if (permission === 'granted' && pushSubscription.isSupported && !pushSubscription.isSubscribed) {
      pushSubscription.subscribe();
    }
  }, [permission, pushSubscription.isSupported, pushSubscription.isSubscribed]); // eslint-disable-line react-hooks/exhaustive-deps

  const requestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    // Se concedida, inscreve no push automaticamente
    if (result === 'granted' && pushSubscription.isSupported) {
      await pushSubscription.subscribe();
    }
    return result;
  }, [pushSubscription]); // eslint-disable-line react-hooks/exhaustive-deps

  const sendEventNotification = useCallback(
    (event) => {
      if (permission !== 'granted') return;
      if (!shouldNotify(event.type)) return;

      const notification = formatEventNotification(event, devices, t);
      if (notification) {
        showNotification(notification.title, {
          body: notification.body,
          icon: notification.icon,
          tag: notification.tag,
          data: notification.data,
        });
      }
    },
    [permission, devices, t]
  );

  return {
    supported: isNotificationSupported(),
    permission,
    requestPermission,
    sendEventNotification,
    pushSubscription,
  };
};

export default useNotifications;
