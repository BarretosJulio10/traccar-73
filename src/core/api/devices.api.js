import fetchOrThrow from '../../common/util/fetchOrThrow';

export const devicesApi = {
  list: () =>
    fetchOrThrow('/api/devices').then((r) => r.json()),

  get: (id) =>
    fetchOrThrow(`/api/devices/${id}`).then((r) => r.json()),

  create: (data) =>
    fetchOrThrow('/api/devices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  update: (id, data) =>
    fetchOrThrow(`/api/devices/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  delete: (id) =>
    fetchOrThrow(`/api/devices/${id}`, { method: 'DELETE' }),

  getAccumulators: (id) =>
    fetchOrThrow(`/api/devices/${id}/accumulators`).then((r) => r.json()),

  updateAccumulators: (id, data) =>
    fetchOrThrow(`/api/devices/${id}/accumulators`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }),
};
