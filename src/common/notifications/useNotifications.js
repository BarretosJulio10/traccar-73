/**
 * Notifications React Hook Module
 *
 * Connects the notification manager and event formatter to React components.
 * Manages permission state and provides a simple API for triggering notifications.
 *
 * @module useNotifications
 */

import { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from '../components/LocalizationProvider';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  showNotification,
  wasPermissionAsked,
} from './notificationManager';
import { formatEventNotification, shouldNotify } from './notificationEvents';

/**
 * Hook that manages push notification permissions and event delivery.
 *
 * @returns {{
 *   supported: boolean,
 *   permission: string,
 *   requestPermission: () => Promise<string>,
 *   sendEventNotification: (event: Object) => void,
 * }}
 */
const useNotifications = () => {
  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const [permission, setPermission] = useState(getNotificationPermission);

  // Auto-request permission on first load if not yet asked
  useEffect(() => {
    if (isNotificationSupported() && !wasPermissionAsked() && permission === 'default') {
      requestNotificationPermission().then(setPermission);
    }
  }, [permission]);

  const handleRequestPermission = useCallback(async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    return result;
  }, []);

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
    [permission, devices, t],
  );

  return {
    supported: isNotificationSupported(),
    permission,
    requestPermission: handleRequestPermission,
    sendEventNotification,
  };
};

export default useNotifications;
