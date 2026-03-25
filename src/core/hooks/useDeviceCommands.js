import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { devicesActions } from '../../store';
import { commandsApi } from '../api';
import { sendNotification } from '../../common/notifications/notifyUtil';
import { SESSION } from '../config/storageKeys';

/**
 * useDeviceCommands — lógica de comandos de bloqueio/liberação do veículo.
 *
 * CONTRATO:
 *   { isBlocked, isPending, lock, unlock, sendCommand, lastResult }
 *
 * Usado por: DeviceRow, VehicleDetailsPanel, e qualquer futuro modelo de UI.
 * A lógica de negócio vive aqui; os componentes apenas chamam lock() / unlock().
 */
export const useDeviceCommands = (deviceId) => {
  const dispatch = useDispatch();
  const device = useSelector((state) => state.devices.items[deviceId]);

  const isBlockedFromStore = device?.attributes?.blocked ?? false;
  const [isBlockedLocal, setIsBlockedLocal] = useState(isBlockedFromStore);
  const [isPending, setIsPending] = useState(false);
  const [lastResult, setLastResult] = useState(null); // 'success' | 'error' | null

  const isDemo = () => window.sessionStorage.getItem(SESSION.DEMO_MODE) === 'true';

  const sendCommand = useCallback(async (type) => {
    if (!device) return;
    setIsPending(true);
    setLastResult(null);
    const newBlocked = type === 'engineStop';
    setIsBlockedLocal(newBlocked);

    try {
      if (!isDemo()) {
        await commandsApi.send(deviceId, type);
      } else {
        await new Promise((r) => setTimeout(r, 700));
      }

      dispatch(devicesActions.update([{
        ...device,
        attributes: { ...device.attributes, blocked: newBlocked },
      }]));

      sendNotification(
        newBlocked ? '🔒 Veículo Bloqueado' : '🔓 Veículo Liberado',
        `${device.name} — Comando enviado com sucesso`,
        {
          tag: `lock-${deviceId}-${Date.now()}`,
          data: { deviceId, type },
          requireInteraction: newBlocked,
        },
      );
      setLastResult('success');
    } catch {
      setIsBlockedLocal(!newBlocked); // revert
      setLastResult('error');
    } finally {
      setIsPending(false);
    }
  }, [device, deviceId, dispatch]);

  const lock   = useCallback(() => sendCommand('engineStop'),   [sendCommand]);
  const unlock = useCallback(() => sendCommand('engineResume'), [sendCommand]);

  return {
    isBlocked: isBlockedLocal,
    isPending,
    lastResult,
    lock,
    unlock,
    sendCommand,
  };
};
