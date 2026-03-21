import { useState, useEffect, useCallback } from 'react';

const PERMISSION_TYPES = {
  notification: 'notification',
  geolocation: 'geolocation',
  camera: 'camera',
};

const STATUS = {
  granted: 'granted',
  denied: 'denied',
  prompt: 'prompt',
  unsupported: 'unsupported',
};

const getNotificationStatus = () => {
  if (!('Notification' in window)) return STATUS.unsupported;
  return Notification.permission;
};

const getGeolocationStatus = async () => {
  if (!('geolocation' in navigator)) return STATUS.unsupported;
  try {
    const result = await navigator.permissions.query({ name: 'geolocation' });
    return result.state;
  } catch {
    return STATUS.prompt;
  }
};

const getCameraStatus = async () => {
  if (!navigator.mediaDevices?.getUserMedia) return STATUS.unsupported;
  try {
    const result = await navigator.permissions.query({ name: 'camera' });
    return result.state;
  } catch {
    return STATUS.prompt;
  }
};

const useDevicePermissions = () => {
  const [permissions, setPermissions] = useState({
    notification: STATUS.prompt,
    geolocation: STATUS.prompt,
    camera: STATUS.prompt,
  });

  const refreshPermissions = useCallback(async () => {
    const [geo, cam] = await Promise.all([getGeolocationStatus(), getCameraStatus()]);

    setPermissions({
      notification: getNotificationStatus(),
      geolocation: geo,
      camera: cam,
    });
  }, []);

  useEffect(() => {
    refreshPermissions();
  }, [refreshPermissions]);

  const requestPermission = useCallback(async (type) => {
    try {
      switch (type) {
        case PERMISSION_TYPES.notification: {
          if (!('Notification' in window)) return STATUS.unsupported;
          const result = await Notification.requestPermission();
          setPermissions((prev) => ({ ...prev, notification: result }));
          return result;
        }
        case PERMISSION_TYPES.geolocation: {
          if (!('geolocation' in navigator)) return STATUS.unsupported;
          return new Promise((resolve) => {
            navigator.geolocation.getCurrentPosition(
              () => {
                setPermissions((prev) => ({ ...prev, geolocation: STATUS.granted }));
                resolve(STATUS.granted);
              },
              (err) => {
                const status = err.code === 1 ? STATUS.denied : STATUS.prompt;
                setPermissions((prev) => ({ ...prev, geolocation: status }));
                resolve(status);
              },
            );
          });
        }
        case PERMISSION_TYPES.camera: {
          if (!navigator.mediaDevices?.getUserMedia) return STATUS.unsupported;
          try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach((track) => track.stop());
            setPermissions((prev) => ({ ...prev, camera: STATUS.granted }));
            return STATUS.granted;
          } catch {
            setPermissions((prev) => ({ ...prev, camera: STATUS.denied }));
            return STATUS.denied;
          }
        }
        default:
          return STATUS.unsupported;
      }
    } catch {
      return STATUS.denied;
    }
  }, []);

  const requestAllPermissions = useCallback(async () => {
    const results = await Promise.all([
      requestPermission(PERMISSION_TYPES.notification),
      requestPermission(PERMISSION_TYPES.geolocation),
      requestPermission(PERMISSION_TYPES.camera),
    ]);
    return {
      notification: results[0],
      geolocation: results[1],
      camera: results[2],
    };
  }, [requestPermission]);

  return {
    permissions,
    requestPermission,
    requestAllPermissions,
    refreshPermissions,
    PERMISSION_TYPES,
    STATUS,
  };
};

export default useDevicePermissions;
