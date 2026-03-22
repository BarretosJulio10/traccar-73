import fetchOrThrow from '../../common/util/fetchOrThrow';

/**
 * Adapter para abstrair a comunicação com entidades de Dispositivos baseadas no Traccar.
 * Componentes de UI devem usar este adapter ou um Hook abstraído, não o fetch direto.
 */
export const traccarDevicesAdapter = {
  fetchDevices: async () => {
    const response = await fetchOrThrow('/api/devices');
    return response.json();
  },
};
