import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

const OSM_STYLE = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      maxzoom: 19,
    },
  },
  layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
};

const DeviceMiniMap = ({ lat, lng, isOnline }) => {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map once
  useEffect(() => {
    if (!containerRef.current || !lat || !lng) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OSM_STYLE,
      center: [lng, lat],
      zoom: 15,
      interactive: false,
      attributionControl: false,
    });

    const el = document.createElement('div');
    el.className = 'device-minimap-dot';
    el.style.cssText = `
      width:14px;height:14px;
      background:${isOnline ? '#22c55e' : '#9ca3af'};
      border:2.5px solid #fff;
      border-radius:50%;
      box-shadow:0 0 8px rgba(34,197,94,0.5);
    `;
    if (isOnline) el.style.animation = 'minimapPulse 2s ease-in-out infinite';

    const marker = new maplibregl.Marker({ element: el, anchor: 'center' })
      .setLngLat([lng, lat])
      .addTo(map);

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track live position changes
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !lat || !lng) return;
    markerRef.current.setLngLat([lng, lat]);
    mapRef.current.easeTo({ center: [lng, lat], duration: 800 });
  }, [lat, lng]);

  if (!lat || !lng) {
    return (
      <div
        className="w-full rounded-xl flex items-center justify-center"
        style={{ height: 150, background: 'rgba(0,0,0,0.06)' }}
      >
        <span className="text-[9px] font-bold uppercase tracking-widest opacity-30">Sem posição</span>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-xl overflow-hidden"
      style={{ height: 150 }}
    />
  );
};

export default DeviceMiniMap;
