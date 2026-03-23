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
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useCatchCallback } from '../reactHelper';
import { traccarCommandsAdapter } from '../adapters/traccar/commandsAdapter';
import fetchOrThrow from '../common/util/fetchOrThrow';

dayjs.extend(relativeTime);

import { COMPACT_HEIGHT, EXPANDED_HEIGHT, ANCHOR_EXPANDED_HEIGHT, ANCHOR_AUTOBLOCK_KEY, ANCHOR_STORAGE_KEY } from '../common/util/constants';
import { sendNotification } from '../common/notifications/notifyUtil';

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

  // Persistent anchor data for this device
  const [anchor, setAnchor] = useState(() => {
    const stored = JSON.parse(localStorage.getItem(ANCHOR_STORAGE_KEY) || '{}');
    return stored[item.id] || null;
  });

  const saveAnchor = (data) => {
    const stored = JSON.parse(localStorage.getItem(ANCHOR_STORAGE_KEY) || '{}');
    if (data) {
      stored[item.id] = data;
    } else {
      delete stored[item.id];
    }
    localStorage.setItem(ANCHOR_STORAGE_KEY, JSON.stringify(stored));
    setAnchor(data);
    window.dispatchEvent(new CustomEvent('anchors-updated'));
  };

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
      const anchorData = {
        lat: position.latitude,
        lon: position.longitude,
        radius: anchorRadius,
        enabled: true,
        autoBlock: anchorAutoBlock,
        geofenceId,
        name: `Âncora — ${item.name}`,
      };
      if (anchorAutoBlock && geofenceId) {
        const rules = JSON.parse(localStorage.getItem(ANCHOR_AUTOBLOCK_KEY) || '{}');
        rules[`${item.id}_${geofenceId}`] = true;
        localStorage.setItem(ANCHOR_AUTOBLOCK_KEY, JSON.stringify(rules));
      }
      saveAnchor(anchorData);
      sendNotification(
        '⚓ Âncora Criada',
        `${item.name} — Cerca de ${anchorRadius}m${anchorAutoBlock ? ' · Auto-bloqueio ativo' : ''}`,
        { tag: `anchor-created-${item.id}`, data: { deviceId: item.id, type: 'anchorCreated' } },
      );
      setAnchorStatus('ok');
      setTimeout(() => { setAnchorStatus(null); setAnchorOpenId(null); }, 1500);
    } catch (_) {
      setAnchorStatus('error');
      setTimeout(() => setAnchorStatus(null), 2500);
    }
  };

  const handleAnchorToggle = (e) => {
    e.stopPropagation();
    if (!anchor) return;
    saveAnchor({ ...anchor, enabled: !anchor.enabled });
  };

  const handleAnchorRemove = (e) => {
    e.stopPropagation();
    if (!anchor) return;
    // Remove autoblock rule if any
    const rules = JSON.parse(localStorage.getItem(ANCHOR_AUTOBLOCK_KEY) || '{}');
    Object.keys(rules).filter((k) => k.startsWith(`${item.id}_`)).forEach((k) => delete rules[k]);
    localStorage.setItem(ANCHOR_AUTOBLOCK_KEY, JSON.stringify(rules));
    saveAnchor(null);
    sendNotification(
      '🗑️ Âncora Removida',
      `${item.name} — Cerca virtual excluída`,
      { tag: `anchor-removed-${item.id}`, data: { deviceId: item.id, type: 'anchorRemoved' } },
    );
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
  // Read blocked from device attributes (source of truth after sending command).
  // Position attributes are not used here because the demo loop overwrites them every 3s.
  const isBlocked = item.attributes?.blocked ?? false;
  const [isBlockedLocal, setIsBlockedLocal] = useState(isBlocked);
  const [isLockPending, setIsLockPending] = useState(false);

  useEffect(() => {
    if (!isLockPending) setIsBlockedLocal(isBlocked);
  }, [isBlocked, isLockPending]);

  const handleLockToggle = async (e) => {
    e.stopPropagation();
    const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
    const newBlocked = !isBlockedLocal;
    const newType = isBlockedLocal ? 'engineResume' : 'engineStop';
    setIsBlockedLocal(newBlocked);
    setIsLockPending(true);
    try {
      if (isDemo) {
        await new Promise((r) => setTimeout(r, 700));
      } else {
        await traccarCommandsAdapter.sendCommand(item.id, newType);
      }
      dispatch(devicesActions.update([{ ...item, attributes: { ...item.attributes, blocked: newBlocked } }]));
      sendNotification(
        newBlocked ? '🔒 Veículo Bloqueado' : '🔓 Veículo Liberado',
        `${item.name} — Comando enviado com sucesso`,
        {
          tag: `lock-${item.id}-${Date.now()}`,
          data: { deviceId: item.id, type: newBlocked ? 'engineStop' : 'engineResume' },
          requireInteraction: newBlocked, // bloqueio fica na tela até o usuário ver
        },
      );
    } catch (_) {
      setIsBlockedLocal(!newBlocked); // revert on real API failure
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
              <h3 className="text-[14px] font-black tracking-tight truncate leading-none mb-1" style={{ color: isSelected ? theme.accent : '#0f172a' }}>
                {item.name}
              </h3>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'animate-pulse' : ''}`} style={{ background: isOnline ? theme.accent : '#cbd5e1' }} />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: isOnline ? theme.accent : '#94a3b8' }}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {(item.attributes?.plate || item.attributes?.placa || item.contact) && (
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {(item.attributes?.plate || item.attributes?.placa) && (
                    <span className="text-[8.5px] font-bold uppercase tracking-wide text-slate-400 flex-shrink-0">
                      {item.attributes.plate || item.attributes.placa}
                    </span>
                  )}
                  {(item.attributes?.plate || item.attributes?.placa) && item.contact && (
                    <span className="text-[8px] text-slate-300 flex-shrink-0">·</span>
                  )}
                  {item.contact && (
                    <span className="text-[8.5px] font-medium text-slate-400 truncate">
                      {item.contact}
                    </span>
                  )}
                </div>
              )}
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
            <div className="flex flex-col gap-2">
              {/* Anchor status row — shows when anchor exists */}
              {anchor ? (
                <div
                  className="flex items-center gap-1.5 px-3 h-11 rounded-xl border transition-all duration-300"
                  style={{
                    background: anchor.enabled ? 'rgba(6,182,212,0.08)' : '#f8fafc',
                    borderColor: anchor.enabled ? '#06b6d4' : '#e2e8f0',
                  }}
                >
                  <AnchorIcon sx={{ fontSize: 15, color: anchor.enabled ? '#06b6d4' : '#94a3b8' }} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: anchor.enabled ? '#06b6d4' : '#94a3b8' }}>
                      Âncora {anchor.enabled ? 'Ativa' : 'Desligada'}
                    </span>
                    <span className="text-[8px] text-slate-400 leading-none mt-0.5">
                      {anchor.radius}m{anchor.autoBlock ? ' · auto-bloqueio' : ''}
                    </span>
                  </div>
                  {anchor.enabled && (
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#06b6d4', flexShrink: 0 }} />
                  )}
                  {/* Toggle on/off */}
                  <button
                    onClick={handleAnchorToggle}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 active:scale-95"
                    style={{
                      background: anchor.enabled ? 'rgba(6,182,212,0.15)' : '#f1f5f9',
                      borderColor: anchor.enabled ? '#06b6d4' : '#e2e8f0',
                      color: anchor.enabled ? '#06b6d4' : '#94a3b8',
                    }}
                    title={anchor.enabled ? 'Desligar âncora' : 'Ligar âncora'}
                  >
                    <PowerSettingsNewIcon sx={{ fontSize: 15 }} />
                  </button>
                  {/* Remove */}
                  <button
                    onClick={handleAnchorRemove}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border border-slate-200 transition-all duration-200 active:scale-95 hover:border-red-300 hover:text-red-400"
                    style={{ background: '#f8fafc', color: '#cbd5e1' }}
                    title="Remover âncora"
                  >
                    <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={openAnchorPanel}
                  disabled={!position}
                  className="h-11 rounded-xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] border transition-all duration-300 active:scale-95"
                  style={{ background: '#f8fafc', borderColor: '#e2e8f0', color: '#94a3b8', opacity: !position ? 0.4 : 1 }}
                >
                  <AnchorIcon sx={{ fontSize: 17 }} />
                  <span>Definir Âncora</span>
                </button>
              )}
              {/* Lock button */}
              <button
                onClick={handleLockToggle}
                disabled={isLockPending}
                className="h-11 rounded-xl flex items-center justify-center gap-1.5 font-black uppercase tracking-[1px] text-[10px] transition-all duration-300 border active:scale-95"
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
                <span>{isBlockedLocal ? 'Liberar Veículo' : 'Bloquear Veículo'}</span>
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
