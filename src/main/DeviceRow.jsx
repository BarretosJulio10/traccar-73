import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { devicesActions } from '../store';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useHudTheme } from '../common/util/ThemeContext';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AnchorIcon from '@mui/icons-material/Anchor';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { useCatchCallback } from '../reactHelper';
import { traccarCommandsAdapter } from '../adapters/traccar/commandsAdapter';
import fetchOrThrow from '../common/util/fetchOrThrow';

dayjs.extend(relativeTime);

import { COMPACT_HEIGHT, EXPANDED_HEIGHT, ANCHOR_EXPANDED_HEIGHT } from '../common/util/constants';

const RADII = [100, 150, 200, 250, 300];

const DeviceRow = ({ index, style, ariaAttributes, ...rowProps }) => {
  const { devices, desktop, onOpenPanel, onClosePanel, panelDeviceId, anchorOpenId, setAnchorOpenId } = rowProps;
  const dispatch = useDispatch();
  const { theme } = useHudTheme();
  const selectedId = useSelector((state) => state.devices.selectedId);
  const item = devices[index];
  const isSelected = item.id === selectedId;
  const isPanelOpen = panelDeviceId === item.id;
  const position = useSelector((state) => state.session.positions[item.id]);

  const speedKmh = position ? Math.round((position.speed || 0) * 1.852) : 0;
  const lastUpdate = position?.fixTime || item.lastUpdate;
  const isOnline = item.status === 'online';
  const [isPending, setIsPending] = useState(false);

  // Anchor config state
  const anchorOpen = anchorOpenId === item.id;
  const [anchorRadius, setAnchorRadius] = useState(200);
  const [anchorAutoBlock, setAnchorAutoBlock] = useState(false);
  const [anchorStatus, setAnchorStatus] = useState(null); // null | 'loading' | 'ok' | 'error'

  const openAnchorPanel = (e) => {
    e.stopPropagation();
    if (!position) return;
    setAnchorOpenId(item.id);
  };

  const closeAnchorPanel = (e) => {
    e?.stopPropagation();
    setAnchorOpenId(null);
  };

  const handleAnchorCreate = async (e) => {
    e.stopPropagation();
    setAnchorStatus('loading');
    try {
      const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
      let geofenceId = null;
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 800));
        geofenceId = Date.now();
      } else {
        const name = `Âncora — ${item.name} (${anchorRadius}m)`;
        const area = `CIRCLE (${position.latitude} ${position.longitude}, ${anchorRadius})`;
        const geoRes = await fetchOrThrow('/api/geofences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, description: 'Geocerca de âncora automática', area, calendarId: 0, attributes: {} }),
        });
        const geofence = await geoRes.json();
        geofenceId = geofence.id;
        await fetchOrThrow('/api/permissions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: item.id, geofenceId }),
        });
      }
      if (anchorAutoBlock && geofenceId) {
        const stored = JSON.parse(localStorage.getItem('traccar_anchor_autoblock') || '{}');
        stored[`${item.id}_${geofenceId}`] = true;
        localStorage.setItem('traccar_anchor_autoblock', JSON.stringify(stored));
      }
      setAnchorStatus('ok');
      setTimeout(() => { setAnchorStatus(null); setAnchorOpenId(null); }, 2000);
    } catch (_) {
      setAnchorStatus('error');
      setTimeout(() => setAnchorStatus(null), 2500);
    }
  };

  const onCommand = useCatchCallback(async (type) => {
    setIsPending(true);
    try {
      const response = await traccarCommandsAdapter.sendCommand(item.id, type);
      if (response.ok) {
        // Command sent successfully
      }
    } finally {
      setIsPending(false);
    }
  }, [item.id]);

  const attrs = position?.attributes || {};
  const isBlocked = attrs.blocked ?? item.attributes?.blocked ?? false;
  const [isBlockedLocal, setIsBlockedLocal] = useState(isBlocked);
  const [isLockPending, setIsLockPending] = useState(false);

  useEffect(() => {
    if (!isLockPending) setIsBlockedLocal(isBlocked);
  }, [isBlocked, isLockPending]);

  const handleLockToggle = async (e) => {
    e.stopPropagation();
    const newType = isBlockedLocal ? 'engineResume' : 'engineStop';
    setIsBlockedLocal(!isBlockedLocal);
    setIsLockPending(true);
    try {
      await traccarCommandsAdapter.sendCommand(item.id, newType);
      dispatch(devicesActions.update([{ ...item, attributes: { ...item.attributes, blocked: newType === 'engineStop' } }]));
    } catch (_) {
      setIsBlockedLocal(isBlockedLocal);
    } finally {
      setIsLockPending(false);
    }
  };

  const battery = Math.round(attrs.batteryLevel || attrs.battery || 0);
  const odometer = position?.attributes?.totalDistance
    ? (position.attributes.totalDistance / 1000).toFixed(1)
    : position?.attributes?.odometer
      ? (position.attributes.odometer / 1000).toFixed(1)
      : '0.0';
  const altitude = position?.altitude ? Math.round(position.altitude) : 0;

  const handleClick = (e) => {
    e.stopPropagation();
    dispatch(devicesActions.selectId(isSelected ? null : item.id));
    // Se o painel estiver aberto com outro veículo, troca automaticamente
    if (panelDeviceId && panelDeviceId !== item.id) {
      onOpenPanel && onOpenPanel(item.id);
    }
  };

  const expandedH = anchorOpen ? ANCHOR_EXPANDED_HEIGHT : EXPANDED_HEIGHT;
  const adjustedStyle = {
    ...style,
    height: isSelected ? expandedH - 10 : (COMPACT_HEIGHT || 80) - 10,
    top: typeof style.top === 'number' ? style.top + 5 : style.top,
  };

  return (
    <div style={adjustedStyle} className="px-2">
      <div
        onClick={handleClick}
        className={`h-full transition-all duration-300 cursor-pointer flex flex-col group p-3 rounded-2xl border relative overflow-hidden ${isPending ? 'opacity-60 pointer-events-none grayscale-[30%]' : ''}`}
        style={{
          background: isSelected ? '#FFFFFF' : '#F8FAFC',
          borderColor: isSelected ? theme.accent : 'rgba(0,0,0,0.03)',
          boxShadow: isSelected ? `0 10px 25px rgba(6,182,212,0.12)` : 'none',
        }}
      >
        {isPending && (
          <div className="absolute inset-0 z-50 flex flex-col gap-2 items-center justify-center bg-white/40 backdrop-blur-[2px]">
             <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
             <span className="text-[10px] font-black tracking-widest text-cyan-800 uppercase animate-pulse">Processando...</span>
          </div>
        )}
        {isSelected && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1.5" 
            style={{ background: theme.accent }}
          />
        )}
        
        {/* Header Row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 bg-slate-50 border border-slate-100">
              <img
                src={mapIcons[mapIconKey(item.category)]}
                alt={item.category}
                className={`w-6 h-6 transition-all duration-300 ${!isOnline ? 'opacity-20 grayscale' : ''}`}
                style={isOnline ? { filter: 'saturate(1.5) hue-rotate(180deg)' } : {}}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h3 className="text-[15px] font-black tracking-tight truncate leading-none mb-1.5" style={{ color: isSelected ? theme.accent : '#0f172a' }}>
                {item.name}
              </h3>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`} style={{ background: isOnline ? theme.accent : '#cbd5e1' }} />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: isOnline ? theme.accent : '#94a3b8' }}>
                  {isOnline ? 'Acoplado' : 'Offline'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="bg-slate-100/50 px-2.5 py-1 rounded-xl border border-slate-200/50">
                <span className="text-[14px] font-black" style={{ color: isOnline ? '#0f172a' : '#94a3b8' }}>
                  {speedKmh}<span className="text-[10px] ml-1 opacity-40">km/h</span>
                </span>
              </div>
            </div>
            {/* Seta — aponta para direita (abrir) ou esquerda (fechar) */}
            <div
              onClick={(e) => {
                e.stopPropagation();
                if (isPanelOpen) {
                  onClosePanel && onClosePanel();
                } else {
                  onOpenPanel && onOpenPanel(item.id);
                }
              }}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 cursor-pointer"
              style={{
                background: isPanelOpen ? 'rgba(6,182,212,0.15)' : isSelected ? 'rgba(6,182,212,0.08)' : '#f1f5f9',
                borderColor: isPanelOpen ? 'rgba(6,182,212,0.6)' : isSelected ? 'rgba(6,182,212,0.3)' : '#e2e8f0',
                color: isPanelOpen ? '#06b6d4' : isSelected ? '#06b6d4' : '#94a3b8',
                transform: isPanelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'all 0.25s ease',
              }}
            >
              <ArrowForwardIosIcon sx={{ fontSize: 13 }} />
            </div>
          </div>
        </div>

        {/* Expanded Section */}
        <div className={`flex flex-col gap-3 mt-4 transition-all duration-300 overflow-hidden ${isSelected ? 'opacity-100' : 'opacity-0 h-0 pointer-events-none'}`}>
          
          {/* Telemetry Strip */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Bateria</span>
              <span className="text-[11px] font-black text-slate-700">{battery}%</span>
            </div>
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Odômetro</span>
              <span className="text-[11px] font-black text-slate-700">{odometer} <span className="text-[8px] opacity-40">km</span></span>
            </div>
            <div className="bg-slate-50/80 p-2 rounded-xl border border-slate-100 flex flex-col items-center">
              <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Altitude</span>
              <span className="text-[11px] font-black text-slate-700">{altitude} <span className="text-[8px] opacity-40">m</span></span>
            </div>
          </div>

          {/* Action Controls */}
          {!anchorOpen ? (
            <div className="flex gap-2">
              <button
                onClick={openAnchorPanel}
                disabled={!position}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] border transition-all duration-300 active:scale-95"
                style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8', opacity: !position ? 0.4 : 1 }}
              >
                <AnchorIcon sx={{ fontSize: 17 }} />
                <span>Âncora</span>
              </button>
              <button
                onClick={handleLockToggle}
                disabled={isLockPending}
                className="flex-1 h-11 rounded-xl flex items-center justify-center gap-1.5 font-black uppercase tracking-[1px] text-[10px] transition-all duration-300 border active:scale-95"
                style={{
                  background: isBlockedLocal ? '#dcfce7' : '#fee2e2',
                  borderColor: isBlockedLocal ? '#86efac' : '#fca5a5',
                  color: isBlockedLocal ? '#16a34a' : '#dc2626',
                  opacity: isLockPending ? 0.6 : 1,
                }}
              >
                {isLockPending
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : isBlockedLocal ? <LockOpenIcon sx={{ fontSize: 17 }} /> : <LockIcon sx={{ fontSize: 17 }} />
                }
                <span>{isBlockedLocal ? 'Liberar' : 'Bloquear'}</span>
              </button>
            </div>
          ) : (
            /* ── Anchor Config Panel ── */
            <div
              className="flex flex-col gap-2.5 p-3 rounded-2xl border"
              style={{ background: '#f8fafc', borderColor: 'rgba(6,182,212,0.25)' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AnchorIcon sx={{ fontSize: 14, color: '#06b6d4' }} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Configurar Âncora</span>
                </div>
                <button onClick={closeAnchorPanel} className="text-slate-300 hover:text-slate-500 transition-colors text-xs font-bold">✕</button>
              </div>

              {/* Radius picker */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider px-0.5">Raio da cerca</span>
                <div className="flex gap-1">
                  {RADII.map((r) => (
                    <button
                      key={r}
                      onClick={() => setAnchorRadius(r)}
                      className="flex-1 h-8 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all duration-150 border"
                      style={{
                        background: anchorRadius === r ? '#06b6d4' : '#fff',
                        borderColor: anchorRadius === r ? '#06b6d4' : '#e2e8f0',
                        color: anchorRadius === r ? '#fff' : '#94a3b8',
                      }}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto-block toggle */}
              <button
                onClick={() => setAnchorAutoBlock(!anchorAutoBlock)}
                className="flex items-center justify-between px-3 h-9 rounded-xl border transition-all duration-200"
                style={{
                  background: anchorAutoBlock ? 'rgba(239,68,68,0.06)' : '#fff',
                  borderColor: anchorAutoBlock ? '#fca5a5' : '#e2e8f0',
                }}
              >
                <div className="flex items-center gap-2">
                  <LockIcon sx={{ fontSize: 13, color: anchorAutoBlock ? '#ef4444' : '#cbd5e1' }} />
                  <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: anchorAutoBlock ? '#ef4444' : '#94a3b8' }}>
                    Bloquear ao sair da cerca
                  </span>
                </div>
                <div
                  className="w-8 h-4 rounded-full transition-all duration-200 flex items-center"
                  style={{ background: anchorAutoBlock ? '#ef4444' : '#e2e8f0', padding: '2px' }}
                >
                  <div
                    className="w-3 h-3 rounded-full bg-white shadow-sm transition-all duration-200"
                    style={{ marginLeft: anchorAutoBlock ? '16px' : '0px' }}
                  />
                </div>
              </button>

              {/* Confirm / Cancel */}
              <div className="flex gap-2 mt-0.5">
                <button
                  onClick={closeAnchorPanel}
                  className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors"
                  style={{ background: '#fff', borderColor: '#e2e8f0', color: '#94a3b8' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnchorCreate}
                  disabled={anchorStatus === 'loading'}
                  className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  style={{
                    background: anchorStatus === 'ok' ? '#10b981' : anchorStatus === 'error' ? '#ef4444' : '#06b6d4',
                    color: '#fff',
                    opacity: anchorStatus === 'loading' ? 0.7 : 1,
                  }}
                >
                  {anchorStatus === 'loading'
                    ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <AnchorIcon sx={{ fontSize: 13 }} />
                  }
                  <span>{anchorStatus === 'ok' ? 'Criada!' : anchorStatus === 'error' ? 'Erro' : 'Criar Âncora'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeviceRow;
