import { useState, useCallback } from 'react';
import { useSelector } from 'react-redux';
import { geofencesApi } from '../api';
import { sendNotification } from '../../common/notifications/notifyUtil';
import { STORAGE, SESSION } from '../config/storageKeys';

/**
 * useAnchorGeofence — lógica completa de âncora geofence.
 *
 * CONTRATO:
 *   { anchor, status, create, toggle, remove }
 *
 * Persiste em localStorage[STORAGE.ANCHORS] = { [deviceId]: AnchorData }
 * Emite evento 'anchors-updated' para MapAnchorZones sincronizar.
 */

const readStore = () => JSON.parse(localStorage.getItem(STORAGE.ANCHORS) || '{}');

const writeStore = (deviceId, data) => {
  const stored = readStore();
  if (data) {
    stored[deviceId] = data;
  } else {
    delete stored[deviceId];
  }
  localStorage.setItem(STORAGE.ANCHORS, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent('anchors-updated'));
};

const isDemo = () => window.sessionStorage.getItem(SESSION.DEMO_MODE) === 'true';

export const useAnchorGeofence = (deviceId) => {
  const position = useSelector((state) => state.session.positions[deviceId]);
  const device   = useSelector((state) => state.devices.items[deviceId]);

  const [anchor, setAnchor] = useState(() => readStore()[deviceId] || null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'

  const persist = useCallback((data) => {
    writeStore(deviceId, data);
    setAnchor(data);
  }, [deviceId]);

  const create = useCallback(async (radius = 200, autoBlock = false) => {
    if (!position) return;
    setStatus('loading');
    try {
      let geofenceId = null;

      if (!isDemo()) {
        const name = `Âncora — ${device?.name || deviceId} (${radius}m)`;
        const area = `CIRCLE (${position.latitude} ${position.longitude}, ${radius})`;
        const geo = await geofencesApi.create({
          name,
          description: 'Geocerca de âncora automática',
          area,
          calendarId: 0,
          attributes: {},
        });
        geofenceId = geo.id;
        await geofencesApi.linkToDevice(geofenceId, deviceId).catch(() => {});
      } else {
        await new Promise((r) => setTimeout(r, 800));
        geofenceId = Date.now();
      }

      if (autoBlock && geofenceId) {
        const rules = JSON.parse(localStorage.getItem(STORAGE.ANCHOR_AUTOBLOCK) || '{}');
        rules[`${deviceId}_${geofenceId}`] = true;
        localStorage.setItem(STORAGE.ANCHOR_AUTOBLOCK, JSON.stringify(rules));
      }

      const data = {
        lat: position.latitude,
        lon: position.longitude,
        radius,
        enabled: true,
        autoBlock,
        geofenceId,
        name: `Âncora — ${device?.name || deviceId}`,
      };

      persist(data);
      sendNotification(
        '⚓ Âncora Criada',
        `${device?.name || deviceId} — Cerca de ${radius}m${autoBlock ? ' · Auto-bloqueio ativo' : ''}`,
        { tag: `anchor-created-${deviceId}`, data: { deviceId, type: 'anchorCreated' } },
      );
      setStatus('success');
      setTimeout(() => setStatus('idle'), 1500);
    } catch {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2500);
    }
  }, [deviceId, position, device, persist]);

  const toggle = useCallback(() => {
    if (!anchor) return;
    persist({ ...anchor, enabled: !anchor.enabled });
  }, [anchor, persist]);

  const remove = useCallback(() => {
    if (!anchor) return;
    // Limpa regras de auto-bloqueio associadas
    const rules = JSON.parse(localStorage.getItem(STORAGE.ANCHOR_AUTOBLOCK) || '{}');
    Object.keys(rules)
      .filter((k) => k.startsWith(`${deviceId}_`))
      .forEach((k) => delete rules[k]);
    localStorage.setItem(STORAGE.ANCHOR_AUTOBLOCK, JSON.stringify(rules));

    persist(null);
    sendNotification(
      '🗑️ Âncora Removida',
      `${device?.name || deviceId} — Cerca virtual excluída`,
      { tag: `anchor-removed-${deviceId}`, data: { deviceId, type: 'anchorRemoved' } },
    );
  }, [anchor, deviceId, device, persist]);

  return { anchor, status, create, toggle, remove };
};
