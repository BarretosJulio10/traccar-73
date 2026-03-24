import { useState, useCallback, useMemo } from 'react';
import { geometryToArea } from '../../map/core/mapUtil';

const haversine = (from, to) => {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(to[1] - from[1]);
  const dLon = toRad(to[0] - from[0]);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(from[1])) * Math.cos(toRad(to[1])) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

/**
 * State machine for geofence creation.
 *
 * Circle steps: 'idle' → 'center' → 'radius' → 'done'
 * Polygon steps: 'idle' → 'drawing' → 'done'
 */
const useGeofence = (initialDeviceId) => {
  // Mode
  const [mode, setModeState] = useState('circle'); // 'circle' | 'polygon'

  // Circle drawing
  const [circleStep, setCircleStep] = useState('idle');
  const [circleCenter, setCircleCenter] = useState(null); // [lng, lat]
  const [circleRadius, setCircleRadius] = useState(500);
  const [circleRadiusPreview, setCircleRadiusPreview] = useState(null);

  // Polygon drawing
  const [polyStep, setPolyStep] = useState('idle');
  const [polyPoints, setPolyPoints] = useState([]); // [[lng, lat], ...]
  const [previewPoint, setPreviewPoint] = useState(null); // live mouse position

  // Form
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Vehicle selection (pre-select deviceId from URL if provided)
  const [selectedDeviceIds, setSelectedDeviceIds] = useState(
    () => (initialDeviceId ? [Number(initialDeviceId)] : []),
  );

  // ── Computed ───────────────────────────────────────────────────────────────

  const isDrawingDone = useMemo(
    () => (mode === 'circle' ? circleStep === 'done' : polyStep === 'done'),
    [mode, circleStep, polyStep],
  );

  const canSave = isDrawingDone && name.trim().length > 0;

  const area = useMemo(() => {
    if (mode === 'circle' && circleStep === 'done' && circleCenter) {
      return `CIRCLE (${circleCenter[1]} ${circleCenter[0]}, ${circleRadius})`;
    }
    if (mode === 'polygon' && polyStep === 'done' && polyPoints.length >= 3) {
      const closed = [...polyPoints, polyPoints[0]];
      return geometryToArea({ type: 'Polygon', coordinates: [closed] });
    }
    return null;
  }, [mode, circleStep, circleCenter, circleRadius, polyStep, polyPoints]);

  // ── Mode ──────────────────────────────────────────────────────────────────

  const setMode = useCallback((m) => {
    setModeState(m);
    setCircleStep('idle');
    setCircleCenter(null);
    setCircleRadius(500);
    setCircleRadiusPreview(null);
    setPolyStep('idle');
    setPolyPoints([]);
    setPreviewPoint(null);
  }, []);

  // ── Drawing actions ────────────────────────────────────────────────────────

  const startDrawing = useCallback(() => {
    if (mode === 'circle') setCircleStep('center');
    else { setPolyStep('drawing'); setPolyPoints([]); }
  }, [mode]);

  // Select mode AND start drawing in one action (for icon buttons)
  const startModeDrawing = useCallback((m) => {
    setModeState(m);
    setCircleStep(m === 'circle' ? 'center' : 'idle');
    setCircleCenter(null);
    setCircleRadius(500);
    setCircleRadiusPreview(null);
    setPolyStep(m === 'polygon' ? 'drawing' : 'idle');
    setPolyPoints([]);
    setPreviewPoint(null);
  }, []);

  const resetDrawing = useCallback(() => {
    setCircleStep('idle');
    setCircleCenter(null);
    setCircleRadius(500);
    setCircleRadiusPreview(null);
    setPolyStep('idle');
    setPolyPoints([]);
    setPreviewPoint(null);
  }, []);

  const closePolygon = useCallback(() => {
    if (polyPoints.length >= 3) {
      setPolyStep('done');
      setPreviewPoint(null);
    }
  }, [polyPoints.length]);

  // ── Map interaction ────────────────────────────────────────────────────────

  const handleMapClick = useCallback(
    (lngLat) => {
      if (mode === 'circle') {
        if (circleStep === 'center') {
          setCircleCenter([lngLat.lng, lngLat.lat]);
          setCircleRadiusPreview(500);
          setCircleStep('radius');
        } else if (circleStep === 'radius') {
          const dist = haversine([circleCenter[0], circleCenter[1]], [lngLat.lng, lngLat.lat]);
          const r = Math.max(Math.round(dist), 10);
          setCircleRadius(r);
          setCircleRadiusPreview(r);
          setCircleStep('done');
        }
      } else if (mode === 'polygon' && polyStep === 'drawing') {
        setPolyPoints((prev) => [...prev, [lngLat.lng, lngLat.lat]]);
      }
    },
    [mode, circleStep, circleCenter, polyStep],
  );

  const handleMouseMove = useCallback(
    (lngLat) => {
      if (mode === 'circle' && circleStep === 'radius' && circleCenter) {
        const dist = haversine(circleCenter, [lngLat.lng, lngLat.lat]);
        setCircleRadiusPreview(Math.max(Math.round(dist), 10));
      }
      if (mode === 'polygon' && polyStep === 'drawing') {
        setPreviewPoint([lngLat.lng, lngLat.lat]);
      }
    },
    [mode, circleStep, circleCenter, polyStep],
  );

  const handleSetRadius = useCallback((val) => {
    const r = Math.max(10, Math.min(100000, Number(val) || 10));
    setCircleRadius(r);
    setCircleRadiusPreview(r);
  }, []);

  // ── Vehicles ──────────────────────────────────────────────────────────────

  const toggleDevice = useCallback((id) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id],
    );
  }, []);

  const setAllDevices = useCallback((ids) => {
    setSelectedDeviceIds(ids);
  }, []);

  return {
    // Mode
    mode, setMode,
    // Circle
    circleStep, circleCenter, circleRadius, circleRadiusPreview,
    // Polygon
    polyStep, polyPoints, previewPoint,
    // Form
    name, setName, description, setDescription,
    // Vehicles
    selectedDeviceIds, toggleDevice, setAllDevices,
    // Computed
    isDrawingDone, canSave, area,
    // Actions
    startDrawing, startModeDrawing, resetDrawing, closePolygon,
    handleMapClick, handleMouseMove, handleSetRadius,
  };
};

export default useGeofence;
