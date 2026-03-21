import { useId, useEffect } from 'react';
import { map } from './core/MapView';

const MapHeatmap = ({ positions }) => {
  const id = useId();

  useEffect(() => {
    map.addSource(id, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [],
      },
    });

    map.addLayer({
      id: id,
      type: 'heatmap',
      source: id,
      maxzoom: 15,
      paint: {
        'heatmap-weight': 1,
        'heatmap-intensity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 1,
          15, 3
        ],
        'heatmap-color': [
          'interpolate',
          ['linear'],
          ['heatmap-density'],
          0, 'rgba(33,102,172,0)',
          0.2, 'rgb(103,169,207)',
          0.4, 'rgb(209,229,240)',
          0.6, 'rgb(253,219,199)',
          0.8, 'rgb(239,138,98)',
          1, 'rgb(178,24,43)'
        ],
        'heatmap-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          0, 2,
          9, 20
        ],
        'heatmap-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          14, 1,
          15, 0.5
        ]
      },
    });

    return () => {
      if (map.getLayer(id)) {
        map.removeLayer(id);
      }
      if (map.getSource(id)) {
        map.removeSource(id);
      }
    };
  }, [id]);

  useEffect(() => {
    map.getSource(id)?.setData({
      type: 'FeatureCollection',
      features: positions.map((position) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [position.longitude, position.latitude],
        },
        properties: { },
      })),
    });
  }, [id, positions]);

  return null;
};

export default MapHeatmap;
