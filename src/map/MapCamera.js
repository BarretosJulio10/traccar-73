import { useEffect } from 'react';
import maplibregl from 'maplibre-gl';
import { map } from './core/MapView';

const MapCamera = ({ latitude, longitude, positions, coordinates }) => {
  useEffect(() => {
    let normalizedCoordinates = null;

    if (coordinates) {
      normalizedCoordinates = coordinates
        .map((item) => {
          if (Array.isArray(item)) return item;
          if (item && typeof item.longitude === 'number' && typeof item.latitude === 'number') {
            return [item.longitude, item.latitude];
          }
          return null;
        })
        .filter((item) => item && !Number.isNaN(item[0]) && !Number.isNaN(item[1]));
    } else if (positions) {
      normalizedCoordinates = positions
        .map((item) => [item.longitude, item.latitude])
        .filter((item) => item && !Number.isNaN(item[0]) && !Number.isNaN(item[1]));
    }

    if (normalizedCoordinates && normalizedCoordinates.length > 0) {
      try {
        const bounds = normalizedCoordinates.reduce(
          (bounds, item) => bounds.extend(item),
          new maplibregl.LngLatBounds(normalizedCoordinates[0], normalizedCoordinates[0]),
        );
        const canvas = map.getCanvas();
        map.fitBounds(bounds, {
          padding: Math.min(canvas.width, canvas.height) * 0.1,
          duration: 0,
        });
      } catch (e) {
        console.warn('MapCamera: Failed to fit bounds', e);
      }
    } else {
      const isValid = (val) => typeof val === 'number' && !Number.isNaN(val);
      if (isValid(latitude) && isValid(longitude)) {
        map.jumpTo({
          center: [longitude, latitude],
          zoom: Math.max(map.getZoom(), 10),
        });
      }
    }
  }, [latitude, longitude, positions, coordinates]);

  return null;
};

export default MapCamera;
