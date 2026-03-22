import fetchOrThrow from '../../common/util/fetchOrThrow';

/**
 * Adapter para abstrair relatórios e eventos provenientes do Tracking Backend (Traccar).
 */
export const traccarReportsAdapter = {
  fetchEvents: async (query) => {
    const response = await fetchOrThrow(`/api/reports/events?${query.toString()}`, {
      headers: { Accept: 'application/json' },
    });
    return response.json();
  },
};
