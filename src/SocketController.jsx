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
import { useAttributePreference } from './common/util/preferences';
import {
  handleNativeNotificationListeners,
  nativePostMessage,
} from './common/components/NativeInterface';
import fetchOrThrow from './common/util/fetchOrThrow';
import useNotifications from './common/notifications/useNotifications';

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

      dispatch(devicesActions.update(devices));
      dispatch(sessionActions.updatePositions(positions));
      dispatch(sessionActions.updateSocket(true));

      // Poll events alongside data
      pollEvents();
    } catch (error) {
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
          const response = await fetchOrThrow('/api/devices');
          dispatch(devicesActions.refresh(await response.json()));
          nativePostMessage('authenticated');
          dispatch(sessionActions.updateSocket(true));
        } catch (error) {
          console.error('Initial device fetch failed:', error);
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
