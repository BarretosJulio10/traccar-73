import fetchOrThrow from '../../common/util/fetchOrThrow';

export const groupsApi = {
  list: () =>
    fetchOrThrow('/api/groups').then((r) => r.json()),

  create: (data) =>
    fetchOrThrow('/api/groups', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  update: (id, data) =>
    fetchOrThrow(`/api/groups/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  delete: (id) =>
    fetchOrThrow(`/api/groups/${id}`, { method: 'DELETE' }),
};
