/**
 * Notification Manager Module
 *
 * Manages browser/PWA push notification permissions and delivery.
 * Uses the Web Notifications API (no Firebase/VAPID required).
 * Works on desktop browsers and installed PWAs.
 *
 * @module notificationManager
 */

const PERMISSION_KEY = 'notification_permission_asked';

/**
 * Checks if the Notification API is supported in the current browser.
 * @returns {boolean}
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Returns the current notification permission status.
 * @returns {'granted'|'denied'|'default'|'unsupported'}
 */
export const getNotificationPermission = () => {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
};

/**
 * Requests notification permission from the user.
 * Stores the fact that permission was asked to avoid repeated prompts.
 * @returns {Promise<'granted'|'denied'|'default'|'unsupported'>}
 */
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) return 'unsupported';

  try {
    const result = await Notification.requestPermission();
    localStorage.setItem(PERMISSION_KEY, 'true');
    return result;
  } catch (error) {
    console.error('[NotificationManager] Permission request failed:', error);
    return 'default';
  }
};

/**
 * Whether the user has already been asked for notification permission.
 * @returns {boolean}
 */
export const wasPermissionAsked = () => {
  return localStorage.getItem(PERMISSION_KEY) === 'true';
};

/**
 * Shows a native browser/PWA notification.
 * Uses service worker registration when available (PWA background support).
 * Falls back to standard Notification constructor.
 *
 * @param {string} title - Notification title
 * @param {Object} options - Notification options
 * @param {string} options.body - Notification body text
 * @param {string} [options.icon] - Icon URL
 * @param {string} [options.tag] - Tag for deduplication
 * @param {string} [options.badge] - Badge URL (mobile)
 * @param {Object} [options.data] - Custom data attached to notification
 * @returns {Promise<void>}
 */
export const showNotification = async (title, options = {}) => {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== 'granted') return;

  const notificationOptions = {
    icon: options.icon || '/pwa-192x192.png',
    badge: options.badge || '/pwa-64x64.png',
    tag: options.tag || undefined,
    body: options.body || '',
    data: options.data || {},
    silent: false,
    requireInteraction: options.requireInteraction ?? false,
  };

  try {
    // Prefer service worker for background notification support
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, notificationOptions);
    } else {
      // Fallback to standard Notification (foreground only)
      const notification = new Notification(title, notificationOptions);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    }
  } catch (error) {
    console.error('[NotificationManager] Failed to show notification:', error);
  }
};
