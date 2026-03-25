import fetchOrThrow from '../../common/util/fetchOrThrow';

export const commandsApi = {
  send: (deviceId, type, attributes = {}) =>
    fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, type, attributes }),
    }),

  listSaved: (deviceId) =>
    fetchOrThrow(`/api/commands?deviceId=${deviceId}&limit=100`).then((r) => r.json()),

  create: (data) =>
    fetchOrThrow('/api/commands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  delete: (id) =>
    fetchOrThrow(`/api/commands/${id}`, { method: 'DELETE' }),
};
