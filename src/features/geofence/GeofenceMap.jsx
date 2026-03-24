import { useEffect } from 'react';
import circle from '@turf/circle';
import { map } from '../../map/core/MapView';

// Source / layer IDs — prefixed to avoid conflicts with other MapView children
const CIR_SRC = 'gf-new-cir';
const CIR_FILL = 'gf-new-cir-fill';
const CIR_LINE = 'gf-new-cir-line';
const CIR_DOT_SRC = 'gf-new-cir-dot';
const CIR_DOT = 'gf-new-cir-dot-layer';

const POLY_SRC = 'gf-new-poly';
const POLY_FILL = 'gf-new-poly-fill';
const POLY_LINE = 'gf-new-poly-line';
const POLY_DOT_SRC = 'gf-new-poly-dots';
const POLY_DOT = 'gf-new-poly-dot-layer';

const EMPTY = { type: 'FeatureCollection', features: [] };

const GeofenceMap = ({
  mode,
  circleStep,
  circleCenter,
  circleRadius,
  circleRadiusPreview,
  polyStep,
  polyPoints,
  previewPoint,
  onMapClick,
  onMouseMove,
  onClosePolygon,
}) => {
  // ── Setup / teardown ────────────────────────────────────────────────────────
  useEffect(() => {
    // Circle sources + layers
    if (!map.getSource(CIR_SRC)) map.addSource(CIR_SRC, { type: 'geojson', data: EMPTY });
    if (!map.getLayer(CIR_FILL))
      map.addLayer({ id: CIR_FILL, type: 'fill', source: CIR_SRC, paint: { 'fill-color': '#2dd4bf', 'fill-opacity': 0.15 } });
    if (!map.getLayer(CIR_LINE))
      map.addLayer({ id: CIR_LINE, type: 'line', source: CIR_SRC, paint: { 'line-color': '#2dd4bf', 'line-width': 2.5, 'line-dasharray': [3, 2] } });
    if (!map.getSource(CIR_DOT_SRC)) map.addSource(CIR_DOT_SRC, { type: 'geojson', data: EMPTY });
    if (!map.getLayer(CIR_DOT))
      map.addLayer({ id: CIR_DOT, type: 'circle', source: CIR_DOT_SRC, paint: { 'circle-radius': 7, 'circle-color': '#2dd4bf', 'circle-stroke-width': 2.5, 'circle-stroke-color': '#fff' } });

    // Polygon sources + layers
    if (!map.getSource(POLY_SRC)) map.addSource(POLY_SRC, { type: 'geojson', data: EMPTY });
    if (!map.getLayer(POLY_FILL))
      map.addLayer({ id: POLY_FILL, type: 'fill', source: POLY_SRC, paint: { 'fill-color': '#a78bfa', 'fill-opacity': 0.15 } });
    if (!map.getLayer(POLY_LINE))
      map.addLayer({ id: POLY_LINE, type: 'line', source: POLY_SRC, paint: { 'line-color': '#a78bfa', 'line-width': 2.5 } });
    if (!map.getSource(POLY_DOT_SRC)) map.addSource(POLY_DOT_SRC, { type: 'geojson', data: EMPTY });
    if (!map.getLayer(POLY_DOT))
      map.addLayer({ id: POLY_DOT, type: 'circle', source: POLY_DOT_SRC, paint: { 'circle-radius': 6, 'circle-color': '#a78bfa', 'circle-stroke-width': 2, 'circle-stroke-color': '#fff' } });

    return () => {
      [CIR_DOT, CIR_LINE, CIR_FILL, POLY_DOT, POLY_LINE, POLY_FILL].forEach((l) => {
        if (map.getLayer(l)) map.removeLayer(l);
      });
      [CIR_SRC, CIR_DOT_SRC, POLY_SRC, POLY_DOT_SRC].forEach((s) => {
        if (map.getSource(s)) map.removeSource(s);
      });
      map.getCanvas().style.cursor = '';
    };
  }, []);

  // ── Cursor ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const drawing =
      (mode === 'circle' && (circleStep === 'center' || circleStep === 'radius')) ||
      (mode === 'polygon' && polyStep === 'drawing');
    map.getCanvas().style.cursor = drawing ? 'crosshair' : '';
  }, [mode, circleStep, polyStep]);

  // ── Circle preview ────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'circle') {
      map.getSource(CIR_SRC)?.setData(EMPTY);
      map.getSource(CIR_DOT_SRC)?.setData(EMPTY);
      return;
    }
    const r = circleRadiusPreview ?? (circleStep === 'done' ? circleRadius : null);
    if (circleCenter && r) {
      const polygon = circle(circleCenter, r, { steps: 64, units: 'meters' });
      map.getSource(CIR_SRC)?.setData(polygon);
      map.getSource(CIR_DOT_SRC)?.setData({
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: circleCenter }, properties: {} }],
      });
    } else {
      map.getSource(CIR_SRC)?.setData(EMPTY);
      map.getSource(CIR_DOT_SRC)?.setData(EMPTY);
    }
  }, [mode, circleCenter, circleRadius, circleRadiusPreview, circleStep]);

  // ── Polygon preview ───────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'polygon') {
      map.getSource(POLY_SRC)?.setData(EMPTY);
      map.getSource(POLY_DOT_SRC)?.setData(EMPTY);
      return;
    }
    if (polyPoints.length === 0) {
      map.getSource(POLY_SRC)?.setData(EMPTY);
      map.getSource(POLY_DOT_SRC)?.setData(EMPTY);
      return;
    }

    const pts = [...polyPoints, ...(previewPoint && polyStep === 'drawing' ? [previewPoint] : [])];

    let shapeData;
    if (polyStep === 'done') {
      shapeData = {
        type: 'Feature',
        geometry: { type: 'Polygon', coordinates: [[...polyPoints, polyPoints[0]]] },
        properties: {},
      };
    } else if (pts.length >= 2) {
      shapeData = { type: 'Feature', geometry: { type: 'LineString', coordinates: pts }, properties: {} };
    } else {
      shapeData = EMPTY;
    }

    map.getSource(POLY_SRC)?.setData(shapeData);
    map.getSource(POLY_DOT_SRC)?.setData({
      type: 'FeatureCollection',
      features: polyPoints.map((p) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: p },
        properties: {},
      })),
    });
  }, [mode, polyPoints, previewPoint, polyStep]);

  // ── Click handler ─────────────────────────────────────────────────────────
  useEffect(() => {
    const active =
      (mode === 'circle' && (circleStep === 'center' || circleStep === 'radius')) ||
      (mode === 'polygon' && polyStep === 'drawing');
    if (!active) return undefined;

    // Polygon: debounce single vs double-click so dblclick closes the polygon
    if (mode === 'polygon' && polyStep === 'drawing') {
      let timer = null;
      const handler = (e) => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
          // Second click within 300 ms → treat as double-click, close polygon
          if (onClosePolygon) onClosePolygon();
        } else {
          const lngLat = e.lngLat;
          timer = setTimeout(() => {
            timer = null;
            onMapClick(lngLat);
          }, 280);
        }
      };
      map.doubleClickZoom.disable();
      map.on('click', handler);
      return () => {
        if (timer) clearTimeout(timer);
        map.off('click', handler);
        map.doubleClickZoom.enable();
      };
    }

    // Circle: normal single-click
    const handler = (e) => onMapClick(e.lngLat);
    map.on('click', handler);
    return () => map.off('click', handler);
  }, [mode, circleStep, polyStep, onMapClick, onClosePolygon]);

  // ── Mouse move handler ────────────────────────────────────────────────────
  useEffect(() => {
    const active =
      (mode === 'circle' && circleStep === 'radius') ||
      (mode === 'polygon' && polyStep === 'drawing');
    if (!active) return undefined;
    const handler = (e) => onMouseMove(e.lngLat);
    map.on('mousemove', handler);
    return () => map.off('mousemove', handler);
  }, [mode, circleStep, polyStep, onMouseMove]);

  return null;
};

export default GeofenceMap;
