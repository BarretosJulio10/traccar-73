import fetchOrThrow from '../../common/util/fetchOrThrow';

const qs = (params) => new URLSearchParams(params).toString();

export const reportsApi = {
  positions: (deviceId, from, to) =>
    fetchOrThrow(`/api/positions?${qs({ deviceId, from, to })}`).then((r) => r.json()),

  events: (deviceId, from, to, type = '') => {
    const params = { deviceId, from, to };
    if (type) params.type = type;
    return fetchOrThrow(`/api/reports/events?${qs(params)}`).then((r) => r.json());
  },

  trips: (deviceId, from, to) =>
    fetchOrThrow(`/api/reports/trips?${qs({ deviceId, from, to })}`).then((r) => r.json()),

  stops: (deviceId, from, to) =>
    fetchOrThrow(`/api/reports/stops?${qs({ deviceId, from, to })}`).then((r) => r.json()),

  summary: (deviceId, from, to) =>
    fetchOrThrow(`/api/reports/summary?${qs({ deviceId, from, to })}`).then((r) => r.json()),

  chart: (deviceId, from, to, type) =>
    fetchOrThrow(`/api/reports/chart?${qs({ deviceId, from, to, type })}`).then((r) => r.json()),
};
