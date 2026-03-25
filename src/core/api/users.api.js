import fetchOrThrow from '../../common/util/fetchOrThrow';

export const usersApi = {
  list: () =>
    fetchOrThrow('/api/users').then((r) => r.json()),

  get: (id) =>
    fetchOrThrow(`/api/users/${id}`).then((r) => r.json()),

  create: (data) =>
    fetchOrThrow('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  update: (id, data) =>
    fetchOrThrow(`/api/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }).then((r) => r.json()),

  delete: (id) =>
    fetchOrThrow(`/api/users/${id}`, { method: 'DELETE' }),
};
