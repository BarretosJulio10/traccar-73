/**
 * Notification Events Formatter Module
 *
 * Maps Traccar event types to human-readable notification content.
 * Supports all standard Traccar event types: ignition, geofences, alarms,
 * speed, fuel, maintenance, driver changes, etc.
 *
 * @module notificationEvents
 */

/**
 * Maps a Traccar event type string to its i18n key.
 */
const EVENT_TYPE_KEYS = {
  deviceOnline: 'eventDeviceOnline',
  deviceOffline: 'eventDeviceOffline',
  deviceInactive: 'eventDeviceInactive',
  deviceMoving: 'eventDeviceMoving',
  deviceStopped: 'eventDeviceStopped',
  deviceOverspeed: 'eventDeviceOverspeed',
  deviceFuelDrop: 'eventDeviceFuelDrop',
  deviceFuelIncrease: 'eventDeviceFuelIncrease',
  commandResult: 'eventCommandResult',
  geofenceEnter: 'eventGeofenceEnter',
  geofenceExit: 'eventGeofenceExit',
  alarm: 'eventAlarm',
  ignitionOn: 'eventIgnitionOn',
  ignitionOff: 'eventIgnitionOff',
  maintenance: 'eventMaintenance',
  textMessage: 'eventTextMessage',
  driverChanged: 'eventDriverChanged',
  media: 'eventMedia',
  queuedCommandSent: 'eventQueuedCommandSent',
};

/**
 * Maps event types to emoji prefixes for visual distinction in notifications.
 */
const EVENT_EMOJIS = {
  deviceOnline: '🟢',
  deviceOffline: '🔴',
  deviceMoving: '🚗',
  deviceStopped: '🅿️',
  deviceOverspeed: '⚡',
  deviceFuelDrop: '⛽',
  deviceFuelIncrease: '⛽',
  geofenceEnter: '📍',
  geofenceExit: '📍',
  alarm: '🚨',
  ignitionOn: '🔑',
  ignitionOff: '🔑',
  maintenance: '🔧',
  textMessage: '💬',
  driverChanged: '👤',
  commandResult: '📟',
};

/**
 * Formats a Traccar event into a notification payload.
 *
 * @param {Object} event - Traccar event object
 * @param {number} event.id - Event ID
 * @param {string} event.type - Event type (e.g., 'ignitionOn', 'geofenceEnter')
 * @param {number} event.deviceId - Device ID
 * @param {Object} [event.attributes] - Event attributes
 * @param {Object} devices - Redux devices state (keyed by id)
 * @param {Function} t - Translation function from useTranslation
 * @returns {{ title: string, body: string, icon: string, tag: string, data: Object }|null}
 */
export const formatEventNotification = (event, devices, t) => {
  if (!event || !event.type) return null;

  const device = devices[event.deviceId];
  const deviceName = device?.name || `ID ${event.deviceId}`;
  const emoji = EVENT_EMOJIS[event.type] || '🔔';
  const typeKey = EVENT_TYPE_KEYS[event.type];
  const eventTitle = typeKey ? t(typeKey) : event.type;

  // Build title with emoji
  const title = `${emoji} ${eventTitle}`;

  // Build body with device name and optional details
  let body = deviceName;

  // Add alarm type detail
  if (event.type === 'alarm' && event.attributes?.alarm) {
    const alarmKey = `alarm${event.attributes.alarm.charAt(0).toUpperCase()}${event.attributes.alarm.slice(1)}`;
    const alarmText = t(alarmKey) || event.attributes.alarm;
    body += ` — ${alarmText}`;
  }

  // Add geofence name if available
  if ((event.type === 'geofenceEnter' || event.type === 'geofenceExit') && event.geofenceId) {
    body += ` (Geofence #${event.geofenceId})`;
  }

  // Add speed for overspeed
  if (event.type === 'deviceOverspeed' && event.attributes?.speed) {
    body += ` — ${Math.round(event.attributes.speed * 1.852)} km/h`;
  }

  // Add message content
  if (event.attributes?.message) {
    body += ` — ${event.attributes.message}`;
  }

  return {
    title,
    body,
    icon: '/pwa-192x192.png',
    tag: `traccar-event-${event.id}`,
    data: {
      eventId: event.id,
      deviceId: event.deviceId,
      type: event.type,
    },
  };
};

/**
 * Checks if an event type should trigger a notification.
 * All event types are enabled by default.
 *
 * @param {string} eventType - Traccar event type
 * @returns {boolean}
 */
export const shouldNotify = (eventType) => {
  return eventType in EVENT_TYPE_KEYS;
};
