import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

/**
 * Hook que monitora eventos Traccar de geofenceEnter/geofenceExit
 * e emite notificação sonora + Web Notification ao usuário.
 *
 * Requisitos: permissão de Notification concedida pelo componente
 * pai (InstallPage / useDevicePermissions).
 */
const useGeofenceAlerts = () => {
  const events = useSelector((state) => state.events.items);
  const processedRef = useRef(new Set());

  useEffect(() => {
    if (!events || events.length === 0) return;

    const GEOFENCE_EVENT_TYPES = new Set(['geofenceEnter', 'geofenceExit']);

    events.forEach((event) => {
      if (!event?.id || processedRef.current.has(event.id)) return;
      if (!GEOFENCE_EVENT_TYPES.has(event.type)) return;

      processedRef.current.add(event.id);

      // Limpa buffer para evitar vazamento de memória
      if (processedRef.current.size > 500) {
        const arr = [...processedRef.current];
        processedRef.current = new Set(arr.slice(-250));
      }

      const isEnter = event.type === 'geofenceEnter';
      const title = isEnter ? '📍 Entrou na área' : '📍 Saiu da área';
      const geofenceName = event.geofenceId ? `Geocerca #${event.geofenceId}` : 'Área monitorada';
      const deviceName = event.deviceId ? `Veículo #${event.deviceId}` : 'Dispositivo';
      const body = `${deviceName} ${isEnter ? 'entrou em' : 'saiu de'}: ${geofenceName}`;

      // Notificação sonora via AudioContext (não requer arquivo externo)
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();

        oscillator.connect(gain);
        gain.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(isEnter ? 880 : 660, ctx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(isEnter ? 1320 : 440, ctx.currentTime + 0.3);
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);

        oscillator.onended = () => ctx.close();
      } catch {
        // Navegador sem suporte a AudioContext — silencioso
      }

      // Web Notification
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            tag: `geofence-${event.id}`,
            icon: '/pwa-192x192.png',
            badge: '/pwa-64x64.png',
            requireInteraction: false,
          });
        } catch {
          // Notificação bloqueada — continua sem travar
        }
      }
    });
  }, [events]);
};

export default useGeofenceAlerts;
