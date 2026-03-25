import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import { reportsApi } from '../api';
import { errorsActions } from '../../store';
import { getMockReportData } from '../../main/DemoController';
import { SESSION } from '../config/storageKeys';

/**
 * useRouteReport — lógica de busca e seleção de rota histórica do veículo.
 *
 * CONTRATO:
 *   { items, loading, period, setPeriod, fetch, selectedItem, selectItem, reset }
 *
 * Usado por: VehicleDetailsPanel (aba Rota) e qualquer futuro modelo.
 */
export const useRouteReport = (deviceId) => {
  const dispatch = useDispatch();
  const device = useSelector((state) => state.devices.items[deviceId]);

  const [items, setItems]               = useState([]);
  const [loading, setLoading]           = useState(false);
  const [period, setPeriod]             = useState('today');
  const [selectedItem, setSelectedItem] = useState(null);

  const isDemo = () => window.sessionStorage.getItem(SESSION.DEMO_MODE) === 'true';

  const periodRange = (p) => {
    switch (p) {
      case 'yesterday':  return { from: dayjs().subtract(1, 'day').startOf('day'), to: dayjs().subtract(1, 'day').endOf('day') };
      case 'thisWeek':   return { from: dayjs().startOf('week'),  to: dayjs().endOf('week') };
      case 'thisMonth':  return { from: dayjs().startOf('month'), to: dayjs().endOf('month') };
      default:           return { from: dayjs().startOf('day'),   to: dayjs().endOf('day') };
    }
  };

  const fetch = useCallback(async (p = period) => {
    if (!device) return;
    setLoading(true);
    setItems([]);
    setSelectedItem(null);
    const { from, to } = periodRange(p);
    try {
      if (isDemo()) {
        await new Promise((r) => setTimeout(r, 700));
        setItems(getMockReportData('positions', [device.id], from.toISOString(), to.toISOString()));
      } else {
        const data = await reportsApi.positions(device.id, from.toISOString(), to.toISOString());
        setItems(data);
      }
    } catch (err) {
      dispatch(errorsActions.push(err.message));
    } finally {
      setLoading(false);
    }
  }, [device, period, dispatch]);

  const selectItem = useCallback((item) => setSelectedItem(item), []);

  const reset = useCallback(() => {
    setItems([]);
    setSelectedItem(null);
  }, []);

  return { items, loading, period, setPeriod, fetch, selectedItem, selectItem, reset };
};
