import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTheme } from '@mui/material/styles';
import { map } from '../core/MapView';
import { useAttributePreference } from '../../common/util/preferences';

const MapLiveRoutes = ({ deviceIds = [] }) => {
  const layerId = 'map-live-routes';
  const theme = useTheme();
  
  const user = useSelector((state) => state.session.user);
  const liveRoutesOverride = useSelector((state) => state.session.liveRoutesOverride);
  const liveRoutesPref = useAttributePreference('mapLiveRoutes', 'none');
  const type = liveRoutesOverride || liveRoutesPref;
  const devices = useSelector((state) => state.devices.items || {});
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const history = useSelector((state) => state.session.history || {});

  const mapLineWidth = useAttributePreference('mapLineWidth', 2);
  const mapLineOpacity = useAttributePreference('mapLineOpacity', 1);

  // Initialize source and layer
  useEffect(() => {
    if (user && type !== 'none' && map) {
      if (!map.getSource(layerId)) {
        map.addSource(layerId, {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
        });
      }
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          source: layerId,
          type: 'line',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ['get', 'color'],
            'line-width': ['get', 'width'],
            'line-opacity': ['get', 'opacity'],
          },
        });
      }

      return () => {
        if (map.getLayer(layerId)) map.removeLayer(layerId);
        if (map.getSource(layerId)) map.removeSource(layerId);
      };
    }
    return undefined;
  }, [layerId, type, user]);

  // Filter IDs that actually have history and exist in devices
  const visibleIds = useMemo(() => {
    if (!user || type === 'none' || !deviceIds) return [];
    return deviceIds.filter((deviceId) => {
      const isSelectedType = type === 'selected' ? deviceId === selectedDeviceId : true;
      return isSelectedType && history[deviceId] && Array.isArray(history[deviceId]) && history[deviceId].length > 0 && devices[deviceId];
    });
  }, [user, type, deviceIds, selectedDeviceId, history, devices]);

  // Update data
  useEffect(() => {
    const source = map?.getSource(layerId);
    if (source && type !== 'none' && user) {
      source.setData({
        type: 'FeatureCollection',
        features: visibleIds.map((deviceId) => ({
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: history[deviceId] || [],
          },
          properties: {
            color: devices[deviceId]?.attributes?.['web.reportColor'] || theme.palette.geometry.main,
            width: mapLineWidth,
            opacity: mapLineOpacity,
          },
        })),
      });
    }
  }, [layerId, type, visibleIds, history, devices, theme, mapLineWidth, mapLineOpacity, user]);

  return null;
};

export default MapLiveRoutes;
