/**
 * Notification Events Formatter
 *
 * Maps Traccar event types to human-readable PT-BR notification content.
 * Used by SocketController → useNotifications → sendEventNotification.
 */

const EVENT_CONFIG = {
  deviceOnline:       { emoji: '🟢', title: 'Veículo Online',            requireInteraction: false },
  deviceOffline:      { emoji: '🔴', title: 'Veículo Offline',           requireInteraction: false },
  deviceInactive:     { emoji: '💤', title: 'Veículo Inativo',           requireInteraction: false },
  deviceMoving:       { emoji: '🚨', title: 'Movimento Detectado',       requireInteraction: true  },
  deviceStopped:      { emoji: '🅿️', title: 'Veículo Parou',             requireInteraction: false },
  deviceOverspeed:    { emoji: '⚡', title: 'Velocidade Excessiva',      requireInteraction: true  },
  deviceFuelDrop:     { emoji: '⛽', title: 'Queda de Combustível',      requireInteraction: true  },
  deviceFuelIncrease: { emoji: '⛽', title: 'Abastecimento Detectado',   requireInteraction: false },
  commandResult:      { emoji: '📟', title: 'Resposta do Dispositivo',   requireInteraction: false },
  geofenceEnter:      { emoji: '📍', title: 'Entrou na Cerca Virtual',   requireInteraction: false },
  geofenceExit:       { emoji: '🚪', title: 'Saiu da Cerca Virtual',     requireInteraction: true  },
  alarm:              { emoji: '🚨', title: 'Alarme',                    requireInteraction: true  },
  ignitionOn:         { emoji: '🔑', title: 'Ignição Ligada',            requireInteraction: false },
  ignitionOff:        { emoji: '🔑', title: 'Ignição Desligada',         requireInteraction: false },
  maintenance:        { emoji: '🔧', title: 'Alerta de Manutenção',      requireInteraction: false },
  textMessage:        { emoji: '💬', title: 'Mensagem de Texto',         requireInteraction: false },
  driverChanged:      { emoji: '👤', title: 'Motorista Alterado',        requireInteraction: false },
  media:              { emoji: '📷', title: 'Mídia Recebida',            requireInteraction: false },
  queuedCommandSent:  { emoji: '📡', title: 'Comando Enfileirado',       requireInteraction: false },
};

/** Alarm type labels in PT-BR */
const ALARM_LABELS = {
  sos:          '🆘 SOS — Solicitação de Emergência',
  vibration:    'Vibração detectada',
  movement:     'Movimento Indevido',
  lowspeed:     'Velocidade abaixo do mínimo',
  overspeed:    'Velocidade excessiva',
  fallDown:     'Queda detectada',
  lowPower:     'Bateria Fraca',
  lowBattery:   'Bateria Baixa',
  fault:        'Falha no dispositivo',
  powerOff:     'Dispositivo desligado',
  powerOn:      'Dispositivo ligado',
  door:         'Porta aberta',
  lock:         'Trava ativada',
  unlock:       'Trava desativada',
  geofence:     'Evento de cerca virtual',
  gpsAntennaCut: 'Antena GPS cortada',
  accident:     '💥 Colisão Detectada',
  hardBraking:  'Freada brusca',
  hardAcceleration: 'Aceleração brusca',
  hardCornering: 'Curva agressiva',
  driverDistraction: 'Distração do motorista',
};

/**
 * Formats a Traccar event into a notification payload.
 *
 * @param {Object} event   - Traccar event object
 * @param {Object} devices - Redux devices state (keyed by id)
 * @param {Function} t     - Translation function (kept for compatibility)
 * @returns {{ title, body, icon, tag, data, requireInteraction }|null}
 */
export const formatEventNotification = (event, devices, t, tenantIconUrl) => {
  if (!event || !event.type) return null;

  const config = EVENT_CONFIG[event.type];
  if (!config) return null;

  const device = devices[event.deviceId];
  const deviceName = device?.name || `Dispositivo #${event.deviceId}`;
  const contact = device?.contact ? ` (${device.contact})` : '';
  const plate = device?.attributes?.plate || device?.attributes?.placa;
  const plateStr = plate ? ` · ${plate}` : '';

  const title = `${config.emoji} ${config.title}`;
  let body = `${deviceName}${plateStr}${contact}`;

  // Alarm details
  if (event.type === 'alarm' && event.attributes?.alarm) {
    const alarmLabel = ALARM_LABELS[event.attributes.alarm] || event.attributes.alarm;
    body += ` — ${alarmLabel}`;
  }

  // Geofence name
  if ((event.type === 'geofenceEnter' || event.type === 'geofenceExit') && event.geofenceId) {
    body += ` — Cerca #${event.geofenceId}`;
  }

  // Speed for overspeed
  if (event.type === 'deviceOverspeed' && event.attributes?.speed) {
    const kmh = Math.round(event.attributes.speed * 1.852);
    body += ` — ${kmh} km/h`;
  }

  // Command result detail
  if (event.type === 'commandResult' && event.attributes?.result) {
    body += ` — ${event.attributes.result}`;
  }

  // Extra message
  if (event.attributes?.message && event.type !== 'commandResult') {
    body += ` — ${event.attributes.message}`;
  }

  return {
    title,
    body,
    icon: tenantIconUrl || '/pwa-192x192.png',
    tag: `traccar-event-${event.id}`,
    requireInteraction: config.requireInteraction,
    data: {
      eventId: event.id,
      deviceId: event.deviceId,
      type: event.type,
    },
  };
};

/**
 * Returns true if this event type should trigger a notification.
 * @param {string} eventType
 * @returns {boolean}
 */
export const shouldNotify = (eventType) => eventType in EVENT_CONFIG;
