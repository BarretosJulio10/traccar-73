import fetchOrThrow from '../../common/util/fetchOrThrow';

export const createGeofence = async ({ name, area, description }) => {
  const body = { name, area };
  if (description) body.description = description;
  const response = await fetchOrThrow('/api/geofences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return response.json();
};

export const linkGeofenceToDevice = async (geofenceId, deviceId) => {
  await fetchOrThrow('/api/permissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ geofenceId, deviceId }),
  });
};

export const updateGeofence = async (geofence) => {
  const response = await fetchOrThrow(`/api/geofences/${geofence.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(geofence),
  });
  return response.json();
};

export const deleteGeofence = async (id) => {
  await fetchOrThrow(`/api/geofences/${id}`, { method: 'DELETE' });
};
