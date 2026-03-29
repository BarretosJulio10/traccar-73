import { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector, connect } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Snackbar } from '@mui/material';
import { devicesActions, sessionActions } from './store';
import { useCatchCallback } from './reactHelper';
import { snackBarDurationLongMs } from './common/util/duration';
import alarm from './resources/alarm.mp3';
import { eventsActions } from './store/events';
import useFeatures from './common/util/useFeatures';
import { DEMO_DEVICE_IDS, ALERT_TYPES } from './main/DemoController';
import { useAttributePreference } from './common/util/preferences';
import {
  handleNativeNotificationListeners,
  nativePostMessage,
} from './common/components/NativeInterface';
import fetchOrThrow from './common/util/fetchOrThrow';
import useNotifications from './common/notifications/useNotifications';
import { STORAGE, scopedKey } from './core/config/storageKeys';
// import useGeofenceAlerts from './common/util/useGeofenceAlerts';

const POLLING_INTERVAL = 5000; // 5 seconds
const EVENT_POLLING_WINDOW_MS = 10000; // Look back 10s for events

const SocketController = ({ demoMode }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authenticated = useSelector((state) => Boolean(state.session.user));

  const pollingRef = useRef(null);
  const processedEventIdsRef = useRef(new Set());

  const [notifications, setNotifications] = useState([]);

  const soundEvents = useAttributePreference('soundEvents', '');
  const soundAlarms = useAttributePreference('soundAlarms', 'sos');

  const features = useFeatures();
  const { sendEventNotification } = useNotifications();

  // Alertas sonoros + notificação para eventos de geocercas
  // useGeofenceAlerts();

  const handleEvents = useCallback(
    (events) => {
      if (!features.disableEvents) {
        dispatch(eventsActions.add(events));
      }
      if (
        events.some(
          (e) =>
            soundEvents.includes(e.type) ||
            (e.type === 'alarm' && soundAlarms.includes(e.attributes.alarm)),
        )
      ) {
        new Audio(alarm).play();
      }
      setNotifications(
        events.map((event) => ({
          id: event.id,
          message: event.attributes.message,
          show: true,
        })),
      );

      // Send push notifications for each event
      events.forEach((event) => {
        sendEventNotification(event);
      });

      // Auto-block/unblock: read per-device rules (legacy) and per-geofence rules (new)
      let autoBlockRules = {};
      try { autoBlockRules = JSON.parse(localStorage.getItem(scopedKey(STORAGE.ANCHOR_AUTOBLOCK)) || '{}'); } catch { /* invalid JSON */ }
      let geoRules = {};
      try { geoRules = JSON.parse(localStorage.getItem(scopedKey(STORAGE.ANCHOR_AUTOBLOCK_GEOFENCE)) || '{}'); } catch { /* invalid JSON */ }

      events
        .filter((e) => e.type === 'geofenceExit' && e.geofenceId)
        .forEach((e) => {
          const key = `${e.deviceId}_${e.geofenceId}`;
          const rule = geoRules[e.geofenceId] || {};
          if (autoBlockRules[key] || rule.blockOnExit) {
            fetchOrThrow('/api/commands/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceId: e.deviceId, type: 'engineStop', attributes: {} }),
            }).catch(() => {});
          }
        });

      events
        .filter((e) => e.type === 'geofenceEnter' && e.geofenceId)
        .forEach((e) => {
          const rule = geoRules[e.geofenceId] || {};
          if (rule.unblockOnEnter) {
            fetchOrThrow('/api/commands/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ deviceId: e.deviceId, type: 'engineResume', attributes: {} }),
            }).catch(() => {});
          }
        });
    },
    [features, dispatch, soundEvents, soundAlarms, sendEventNotification],
  );

  const pollEvents = useCallback(async () => {
    try {
      const now = new Date();
      const from = new Date(now.getTime() - EVENT_POLLING_WINDOW_MS);
      const params = new URLSearchParams({
        from: from.toISOString(),
        to: now.toISOString(),
      });
      const response = await fetchOrThrow(`/api/events?${params}`);
      const events = await response.json();

      // Filter out already-processed events
      const newEvents = events.filter((e) => !processedEventIdsRef.current.has(e.id));
      if (newEvents.length > 0) {
        newEvents.forEach((e) => processedEventIdsRef.current.add(e.id));
        handleEvents(newEvents);

        // Prune old event IDs to prevent memory leak (keep last 5000)
        if (processedEventIdsRef.current.size > 5000) {
          const arr = Array.from(processedEventIdsRef.current);
          processedEventIdsRef.current = new Set(arr.slice(-2500));
        }
      }
    } catch {
      // Silent fail — event polling is non-critical
    }
  }, [handleEvents]);

  const pollData = useCallback(async () => {
    try {
      const [devicesResponse, positionsResponse] = await Promise.all([
        fetchOrThrow('/api/devices'),
        fetchOrThrow('/api/positions'),
      ]);

      const devices = await devicesResponse.json();
      const positions = await positionsResponse.json();

      console.info(`[SocketController] Polling success: ${devices.length} devices, ${positions.length} positions.`);
      dispatch(devicesActions.update(devices));
      dispatch(sessionActions.updatePositions(positions));
      dispatch(sessionActions.updateSocket(true));

      // Poll events alongside data
      pollEvents();
    } catch (error) {
      console.warn('[SocketController] Polling failed:', error);
      dispatch(sessionActions.updateSocket(false));
    }
  }, [dispatch, navigate, pollEvents]);

  const pollDataRef = useRef();
  useEffect(() => {
    pollDataRef.current = pollData;
  }, [pollData]);

  // Start polling when authenticated (skip in demo mode)
  useEffect(() => {
    if (authenticated && !demoMode) {
      const initialFetch = async () => {
        try {
          console.info('[SocketController] Running initial fetch...');
          const response = await fetchOrThrow('/api/devices');
          const devices = await response.json();
          console.info(`[SocketController] Initial fetch success: ${devices.length} devices.`);
          dispatch(devicesActions.refresh(devices));
          nativePostMessage('authenticated');
          dispatch(sessionActions.updateSocket(true));
        } catch (error) {
          console.warn('[SocketController] Initial fetch failed:', error);
          dispatch(sessionActions.updateSocket(false));
        }
      };

      initialFetch();
      pollingRef.current = setInterval(() => {
        if (pollDataRef.current) pollDataRef.current();
      }, POLLING_INTERVAL);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
        dispatch(sessionActions.updateSocket(false));
      };
    }
    if (demoMode && authenticated) {
      dispatch(sessionActions.updateSocket(true));
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, demoMode]);

  // Reconnect on visibility change
  useEffect(() => {
    if (!authenticated || demoMode) return undefined;
    const onVisibility = () => {
      if (!document.hidden && !pollingRef.current) {
        if (pollDataRef.current) pollDataRef.current();
        pollingRef.current = setInterval(() => {
          if (pollDataRef.current) pollDataRef.current();
        }, POLLING_INTERVAL);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authenticated, demoMode]);

  // Demo mode: generate a fake event every 20s to test OneSignal push
  useEffect(() => {
    if (!demoMode || !authenticated) return undefined;
    let counter = 0;
    const interval = setInterval(() => {
      const alertType = ALERT_TYPES[counter % ALERT_TYPES.length];
      const deviceId = DEMO_DEVICE_IDS[counter % DEMO_DEVICE_IDS.length];
      counter += 1;
      const fakeEvent = {
        id: 900000 + counter,
        type: alertType.type,
        deviceId,
        eventTime: new Date().toISOString(),
        positionId: 0,
        geofenceId: alertType.type.startsWith('geofence') ? 1001 : 0,
        attributes: {
          ...(alertType.alarm ? { alarm: alertType.alarm } : {}),
          message: `[Demo] ${alertType.type}`,
        },
      };
      handleEvents([fakeEvent]);
    }, 20000);
    return () => clearInterval(interval);
  }, [demoMode, authenticated, handleEvents]);

  const handleNativeNotification = useCatchCallback(
    async (message) => {
      const eventId = message.data.eventId;
      if (eventId) {
        const response = await fetchOrThrow(`/api/events/${eventId}`);
        if (response.ok) {
          const event = await response.json();
          const eventWithMessage = {
            ...event,
            attributes: { ...event.attributes, message: message.notification.body },
          };
          handleEvents([eventWithMessage]);
        }
      }
    },
    [handleEvents],
  );

  useEffect(() => {
    handleNativeNotificationListeners.add(handleNativeNotification);
    return () => handleNativeNotificationListeners.delete(handleNativeNotification);
  }, [handleNativeNotification]);

  return (
    <>
      {notifications.map((notification) => (
        <Snackbar
          key={notification.id}
          open={notification.show}
          message={notification.message}
          autoHideDuration={snackBarDurationLongMs}
          onClose={() => setNotifications(notifications.filter((e) => e.id !== notification.id))}
        />
      ))}
    </>
  );
};

export default connect()(SocketController);
