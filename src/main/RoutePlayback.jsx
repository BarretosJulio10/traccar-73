import { createPortal } from 'react-dom';
import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import dayjs from 'dayjs';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import FastForwardIcon from '@mui/icons-material/FastForward';
import FastRewindIcon from '@mui/icons-material/FastRewind';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import CloseIcon from '@mui/icons-material/Close';
import { useHudTheme } from '../common/util/ThemeContext';
import { map } from '../map/core/MapView';
import { mapIconKey } from '../map/core/preloadImages';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';

const LEFT = 362;
const RIGHT = 422;
const GAP = 2;

const SPEEDS = [1, 2, 5, 10, 30, 60, 120, 300];

// ── Helpers ───────────────────────────────────────────────────────────────────

const calcBearing = (from, to) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const lat1 = toRad(from.latitude);
  const lat2 = toRad(to.latitude);
  const dLon = toRad(to.longitude - from.longitude);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
};

const interpolatePos = (items, targetMs) => {
  if (!items.length) return null;
  const first = items[0];
  const last = items[items.length - 1];
  if (targetMs <= dayjs(first.fixTime).valueOf()) return { lat: first.latitude, lng: first.longitude, bearing: 0, speed: 0 };
  if (targetMs >= dayjs(last.fixTime).valueOf()) return { lat: last.latitude, lng: last.longitude, bearing: 0, speed: Math.round((last.speed || 0) * 1.852) };
  for (let i = 0; i < items.length - 1; i += 1) {
    const t1 = dayjs(items[i].fixTime).valueOf();
    const t2 = dayjs(items[i + 1].fixTime).valueOf();
    if (targetMs >= t1 && targetMs < t2) {
      const t = (t2 - t1) > 0 ? (targetMs - t1) / (t2 - t1) : 0;
      return {
        lat: items[i].latitude + (items[i + 1].latitude - items[i].latitude) * t,
        lng: items[i].longitude + (items[i + 1].longitude - items[i].longitude) * t,
        bearing: calcBearing(items[i], items[i + 1]),
        speed: Math.round((items[i].speed || 0) * 1.852),
      };
    }
  }
  return { lat: last.latitude, lng: last.longitude, bearing: 0, speed: 0 };
};

const fmtDuration = (ms) => {
  if (ms <= 0) return '00:00:00';
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

// ── Map layer IDs ─────────────────────────────────────────────────────────────

const PB_SRC   = 'pb-vehicle-src';
const PB_LAYER = 'pb-vehicle-layer';
const PB_HALO  = 'pb-halo-src';
const PB_HALO_L = 'pb-halo-layer';

// ── Component ─────────────────────────────────────────────────────────────────

const RoutePlayback = ({ device, routeItems, onClose }) => {
  const { theme } = useHudTheme();

  const startMs = useMemo(() => (routeItems.length > 0 ? dayjs(routeItems[0].fixTime).valueOf() : 0), [routeItems]);
  const totalMs = useMemo(() => {
    if (routeItems.length < 2) return 0;
    return dayjs(routeItems[routeItems.length - 1].fixTime).valueOf() - startMs;
  }, [routeItems, startMs]);

  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [speedIdx, setSpeedIdx] = useState(4); // default 60×
  const [follow, setFollow] = useState(true);
  const speed = SPEEDS[speedIdx];

  const rafRef = useRef(null);
  const lastTsRef = useRef(null);

  const currentPos = useMemo(() => interpolatePos(routeItems, startMs + elapsed), [routeItems, startMs, elapsed]);

  // ── Animation loop ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!playing) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      lastTsRef.current = null;
      return undefined;
    }
    const tick = (now) => {
      if (lastTsRef.current !== null) {
        const dt = now - lastTsRef.current;
        setElapsed((prev) => {
          const next = prev + dt * speed;
          if (next >= totalMs) { setPlaying(false); return totalMs; }
          return next;
        });
      }
      lastTsRef.current = now;
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [playing, speed, totalMs]);

  // ── Map layers: setup & teardown ───────────────────────────────────────────
  useEffect(() => {
    const iconKey = `${mapIconKey(device?.category)}-neutral`;
    const initCoords = routeItems.length > 0 ? [routeItems[0].longitude, routeItems[0].latitude] : [0, 0];
    const emptyFeat = { type: 'Feature', geometry: { type: 'Point', coordinates: initCoords }, properties: {} };

    if (!map.getSource(PB_HALO)) map.addSource(PB_HALO, { type: 'geojson', data: emptyFeat });
    if (!map.getLayer(PB_HALO_L)) {
      map.addLayer({
        id: PB_HALO_L, type: 'circle', source: PB_HALO,
        paint: { 'circle-radius': 22, 'circle-color': '#06b6d4', 'circle-opacity': 0.18, 'circle-stroke-width': 2, 'circle-stroke-color': '#06b6d4', 'circle-stroke-opacity': 0.55 },
      });
    }

    if (!map.getSource(PB_SRC)) map.addSource(PB_SRC, { type: 'geojson', data: { type: 'Feature', geometry: { type: 'Point', coordinates: initCoords }, properties: { bearing: 0 } } });
    if (!map.getLayer(PB_LAYER)) {
      map.addLayer({
        id: PB_LAYER, type: 'symbol', source: PB_SRC,
        layout: { 'icon-image': iconKey, 'icon-size': 1.3, 'icon-rotate': ['get', 'bearing'], 'icon-rotation-alignment': 'map', 'icon-allow-overlap': true, 'icon-ignore-placement': true },
      });
    }

    return () => {
      [PB_LAYER, PB_HALO_L].forEach((l) => { if (map.getLayer(l)) map.removeLayer(l); });
      [PB_SRC, PB_HALO].forEach((s) => { if (map.getSource(s)) map.removeSource(s); });
    };
  }, []);

  // ── Update marker position ─────────────────────────────────────────────────
  useEffect(() => {
    if (!currentPos) return;
    const coords = [currentPos.lng, currentPos.lat];
    map.getSource(PB_SRC)?.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: { bearing: currentPos.bearing } });
    map.getSource(PB_HALO)?.setData({ type: 'Feature', geometry: { type: 'Point', coordinates: coords }, properties: {} });
    if (follow) map.easeTo({ center: coords, duration: 180 });
  }, [currentPos, follow]);

  const progress = totalMs > 0 ? elapsed / totalMs : 0;
  const currentDate = dayjs(startMs + elapsed).format('DD/MM/YYYY HH:mm:ss');
  const elapsedFmt = fmtDuration(elapsed);
  const totalFmt = fmtDuration(totalMs);

  const handleSeek = useCallback((e) => {
    setPlaying(false);
    lastTsRef.current = null;
    setElapsed(parseFloat(e.target.value) * totalMs);
  }, [totalMs]);

  const handleReset = useCallback(() => { setPlaying(false); setElapsed(0); lastTsRef.current = null; }, []);
  const handlePlayPause = useCallback(() => {
    if (elapsed >= totalMs) setElapsed(0);
    setPlaying((v) => !v);
  }, [elapsed, totalMs]);

  const bg = theme.isDark ? 'rgba(8,10,14,0.97)' : 'rgba(248,250,252,0.98)';

  return createPortal(
    <>
      {/* Route drawn on map */}
      <MapRoutePath positions={routeItems} />
      <MapRoutePoints positions={routeItems} />

      <div
        style={{
          position: 'fixed',
          bottom: GAP,
          left: LEFT,
          right: RIGHT,
          zIndex: 1001,
          background: bg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          boxShadow: '0 8px 32px rgba(0,0,0,0.32)',
          padding: '12px 16px',
        }}
      >
        {/* ── Row 1: title + current datetime + speed badge + close ── */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-black truncate flex-1" style={{ color: theme.textPrimary }}>
            {device?.name}
          </span>
          <span className="text-[11px] font-black tabular-nums" style={{ color: theme.accent }}>
            {currentDate}
          </span>
          {currentPos && (
            <span className="text-[9px] font-black px-2 py-0.5 rounded-lg tabular-nums" style={{ background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
              {currentPos.speed} km/h
            </span>
          )}
          <span className="text-[9px] font-black px-2 py-0.5 rounded-lg" style={{ background: `${theme.accent}20`, color: theme.accent }}>
            {speed}×
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center border active:scale-90 transition-all"
            style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
          >
            <CloseIcon sx={{ fontSize: 13 }} />
          </button>
        </div>

        {/* ── Progress bar + time labels ── */}
        <div className="relative mb-1">
          <input
            type="range"
            min={0}
            max={1}
            step={0.00005}
            value={progress}
            onChange={handleSeek}
            className="w-full h-2 rounded-full appearance-none cursor-pointer"
            style={{ accentColor: theme.accent }}
          />
        </div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[9px] tabular-nums font-bold" style={{ color: theme.textMuted }}>{elapsedFmt}</span>
          <span className="text-[9px] tabular-nums font-bold" style={{ color: theme.textMuted }}>{totalFmt}</span>
        </div>

        {/* ── Row 3: controls + speed pills + follow ── */}
        <div className="flex items-center gap-2">
          {/* Slower */}
          <button
            type="button"
            onClick={() => setSpeedIdx((i) => Math.max(0, i - 1))}
            disabled={speedIdx === 0}
            className="w-8 h-8 rounded-xl flex items-center justify-center border active:scale-90 transition-all disabled:opacity-30"
            style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
          >
            <FastRewindIcon sx={{ fontSize: 15 }} />
          </button>

          {/* Reset */}
          <button
            type="button"
            onClick={handleReset}
            className="w-8 h-8 rounded-xl flex items-center justify-center border active:scale-90 transition-all"
            style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
          >
            <StopIcon sx={{ fontSize: 15 }} />
          </button>

          {/* Play / Pause */}
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-11 h-11 rounded-2xl flex items-center justify-center active:scale-95 transition-all"
            style={{ background: theme.accent, color: '#fff', boxShadow: `0 4px 16px ${theme.accent}55` }}
          >
            {playing ? <PauseIcon sx={{ fontSize: 20 }} /> : <PlayArrowIcon sx={{ fontSize: 20 }} />}
          </button>

          {/* Faster */}
          <button
            type="button"
            onClick={() => setSpeedIdx((i) => Math.min(SPEEDS.length - 1, i + 1))}
            disabled={speedIdx === SPEEDS.length - 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center border active:scale-90 transition-all disabled:opacity-30"
            style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
          >
            <FastForwardIcon sx={{ fontSize: 15 }} />
          </button>

          {/* Speed presets */}
          <div className="flex gap-1 flex-wrap">
            {SPEEDS.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeedIdx(i)}
                className="h-7 px-2 rounded-lg text-[8px] font-black uppercase transition-all active:scale-90"
                style={{
                  background: i === speedIdx ? `${theme.accent}20` : theme.bgCard,
                  color: i === speedIdx ? theme.accent : theme.textMuted,
                  border: `1px solid ${i === speedIdx ? theme.accent : theme.borderCard}`,
                }}
              >
                {s}×
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Follow toggle */}
          <button
            type="button"
            onClick={() => setFollow((v) => !v)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all flex-shrink-0"
            style={{
              background: follow ? `${theme.accent}18` : theme.bgCard,
              borderColor: follow ? theme.accent : theme.borderCard,
              color: follow ? theme.accent : theme.textMuted,
            }}
          >
            <MyLocationIcon sx={{ fontSize: 11 }} />
            Seguir
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default RoutePlayback;
