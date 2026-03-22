import fetchOrThrow from '../../common/util/fetchOrThrow';

/**
 * Adapter para abstrair o envio de telecomandos baseados no Traccar.
 */
export const traccarCommandsAdapter = {
  sendCommand: async (deviceId, type) => {
    const response = await fetchOrThrow('/api/commands/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId, type }),
    });
    return response;
  },
};
