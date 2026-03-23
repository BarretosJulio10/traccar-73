import { useEffect } from 'react';
import { map } from '../core/MapView';
import { ANCHOR_STORAGE_KEY } from '../../common/util/constants';

const SOURCE_ID = 'anchor-zones-source';

/** Approximates a circle as a GeoJSON Polygon (64 segments) */
function circlePolygon(lat, lon, radiusMeters, points = 64) {
  const coords = [];
  for (let i = 0; i <= points; i++) {
    const angle = (i / points) * 2 * Math.PI;
    const dx = radiusMeters * Math.cos(angle);
    const dy = radiusMeters * Math.sin(angle);
    const newLat = lat + dy / 111320;
    const newLon = lon + dx / (111320 * Math.cos((lat * Math.PI) / 180));
    coords.push([newLon, newLat]);
  }
  return coords;
}

function buildGeoJSON() {
  const stored = JSON.parse(localStorage.getItem(ANCHOR_STORAGE_KEY) || '{}');
  const features = Object.entries(stored).map(([deviceId, anchor]) => ({
    type: 'Feature',
    properties: {
      deviceId,
      enabled: anchor.enabled,
      color: anchor.enabled ? '#06b6d4' : '#94a3b8',
      fillOpacity: anchor.enabled ? 0.12 : 0.05,
      strokeOpacity: anchor.enabled ? 0.85 : 0.35,
      name: anchor.name || 'Âncora',
    },
    geometry: {
      type: 'Polygon',
      coordinates: [circlePolygon(anchor.lat, anchor.lon, anchor.radius)],
    },
  }));
  return { type: 'FeatureCollection', features };
}

const MapAnchorZones = () => {
  useEffect(() => {
    map.addSource(SOURCE_ID, {
      type: 'geojson',
      data: buildGeoJSON(),
    });

    map.addLayer({
      id: 'anchor-zones-fill',
      source: SOURCE_ID,
      type: 'fill',
      paint: {
        'fill-color': ['get', 'color'],
        'fill-opacity': ['get', 'fillOpacity'],
      },
    });

    map.addLayer({
      id: 'anchor-zones-stroke',
      source: SOURCE_ID,
      type: 'line',
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 2,
        'line-dasharray': [5, 3],
        'line-opacity': ['get', 'strokeOpacity'],
      },
    });

    const onUpdate = () => {
      map.getSource(SOURCE_ID)?.setData(buildGeoJSON());
    };

    window.addEventListener('anchors-updated', onUpdate);

    return () => {
      window.removeEventListener('anchors-updated', onUpdate);
      if (map.getLayer('anchor-zones-fill')) map.removeLayer('anchor-zones-fill');
      if (map.getLayer('anchor-zones-stroke')) map.removeLayer('anchor-zones-stroke');
      if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
    };
  }, []);

  return null;
};

export default MapAnchorZones;
