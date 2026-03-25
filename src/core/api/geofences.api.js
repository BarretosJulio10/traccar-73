import fetchOrThrow from '../../common/util/fetchOrThrow';

export const geofencesApi = {
  list: () =>
    fetchOrThrow('/api/geofences').then((r) => r.json()),

  get: (id) =>
    fetchOrThrow(`/api/geofences/${id}`).then((r) => r.json()),

  create: (data) =>
    fetchOrThrow('/api/geofences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  update: (id, data) =>
    fetchOrThrow(`/api/geofences/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  delete: (id) =>
    fetchOrThrow(`/api/geofences/${id}`, { method: 'DELETE' }),

  linkToDevice: (geofenceId, deviceId) =>
    fetchOrThrow('/api/permissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, geofenceId }),
    }),

  unlinkFromDevice: (geofenceId, deviceId) =>
    fetchOrThrow('/api/permissions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, geofenceId }),
    }),
};
