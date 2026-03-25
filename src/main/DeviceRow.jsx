import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { devicesActions } from '../store';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { useHudTheme } from '../common/util/ThemeContext';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import AnchorIcon from '@mui/icons-material/Anchor';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';

import { COMPACT_HEIGHT, EXPANDED_HEIGHT, ANCHOR_EXPANDED_HEIGHT } from '../common/util/constants';
import { useDeviceCommands } from '../core/hooks/useDeviceCommands';
import { useAnchorGeofence } from '../core/hooks/useAnchorGeofence';
import DeviceMiniMap from './DeviceMiniMap';

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
  const isOnline = item.status === 'online';

  // ── UI state para o painel de configuração de âncora ──────────────────────
  const anchorOpen = anchorOpenId === item.id;
  const [anchorRadius, setAnchorRadius] = useState(200);
  const [anchorAutoBlock, setAnchorAutoBlock] = useState(false);

  const openAnchorPanel  = (e) => { e.stopPropagation(); if (position) setAnchorOpenId(item.id); };
  const closeAnchorPanel = (e) => { e?.stopPropagation(); setAnchorOpenId(null); };

  // ── Core hooks — toda lógica de negócio vive aqui ─────────────────────────
  const cmd    = useDeviceCommands(item.id);
  const anchor = useAnchorGeofence(item.id);

  // Mapeia status do hook para os labels do botão de âncora
  const anchorBtnLabel = {
    loading: 'Criando...',
    success: 'Criada!',
    error:   'Erro',
    idle:    'Criar Âncora',
  }[anchor.status];

  // ── Dados de telemetria ───────────────────────────────────────────────────
  const attrs    = position?.attributes || {};
  const battery  = Math.round(attrs.batteryLevel || attrs.battery || 0);
  const odometer = attrs.totalDistance
    ? (attrs.totalDistance / 1000).toFixed(1)
    : attrs.odometer ? (attrs.odometer / 1000).toFixed(1) : '0.0';
  const altitude = position?.altitude ? Math.round(position.altitude) : 0;

  const handleClick = (e) => {
    e.stopPropagation();
    dispatch(devicesActions.selectId(isSelected ? null : item.id));
    if (panelDeviceId && panelDeviceId !== item.id) onOpenPanel?.(item.id);
  };

  const expandedH    = anchorOpen ? ANCHOR_EXPANDED_HEIGHT : EXPANDED_HEIGHT;
  const adjustedStyle = {
    ...style,
    height: isSelected ? expandedH - 10 : (COMPACT_HEIGHT || 80) - 10,
    top: typeof style.top === 'number' ? style.top + 5 : style.top,
  };

  // Cores semânticas do botão de bloqueio
  const lockBg     = cmd.isBlocked ? (theme.isDark ? 'rgba(74,222,128,0.12)' : '#dcfce7')  : (theme.isDark ? 'rgba(248,113,113,0.12)' : '#fee2e2');
  const lockBorder = cmd.isBlocked ? (theme.isDark ? 'rgba(74,222,128,0.3)'  : '#86efac')  : (theme.isDark ? 'rgba(248,113,113,0.3)'  : '#fca5a5');
  const lockColor  = cmd.isBlocked ? (theme.isDark ? '#4ade80' : '#16a34a')                : (theme.isDark ? '#f87171' : '#dc2626');

  return (
    <div style={adjustedStyle} className="px-2">
      <div
        onClick={handleClick}
        className={`h-full transition-all duration-300 cursor-pointer flex flex-col group p-3 rounded-2xl border relative overflow-hidden ${cmd.isPending ? 'opacity-60 pointer-events-none grayscale-[30%]' : ''}`}
        style={{
          background:  isSelected ? theme.bgCard : theme.bg,
          borderColor: isSelected ? theme.accent : theme.borderCard,
          boxShadow:   isSelected
            ? `0 10px 25px rgba(${theme.accentRgb},0.12)`
            : 'var(--hud-nm-card, none)',
        }}
      >
        {cmd.isPending && (
          <div
            className="absolute inset-0 z-50 flex flex-col gap-2 items-center justify-center backdrop-blur-[2px]"
            style={{ background: theme.isDark ? 'rgba(17,18,20,0.75)' : 'rgba(248,250,252,0.75)' }}
          >
            <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${theme.accent} transparent transparent transparent` }} />
            <span className="text-[10px] font-black tracking-widest uppercase animate-pulse" style={{ color: theme.accent }}>Processando...</span>
          </div>
        )}
        {isSelected && (
          <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: theme.accent }} />
        )}

        {/* Header Row */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border"
              style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
            >
              <img
                src={mapIcons[mapIconKey(item.category)]}
                alt={item.category}
                className={`w-6 h-6 transition-all duration-300 ${!isOnline ? 'opacity-20 grayscale' : ''}`}
                style={isOnline ? { filter: 'saturate(1.5) hue-rotate(180deg)' } : {}}
              />
            </div>

            <div className="flex flex-col min-w-0">
              <h3
                className="text-[14px] font-black tracking-tight truncate leading-none mb-1"
                style={{ color: isSelected ? theme.accent : theme.textPrimary }}
              >
                {item.name}
              </h3>
              <div className="flex items-center gap-1.5 mb-0.5">
                <div
                  className={`w-2 h-2 rounded-full flex-shrink-0 ${isOnline ? 'animate-pulse' : ''}`}
                  style={{ background: isOnline ? theme.accent : theme.textMuted }}
                />
                <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: isOnline ? theme.accent : theme.textMuted }}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              {(item.attributes?.plate || item.attributes?.placa || item.contact) && (
                <div className="flex items-center gap-1 min-w-0 overflow-hidden">
                  {(item.attributes?.plate || item.attributes?.placa) && (
                    <span className="text-[8.5px] font-bold uppercase tracking-wide flex-shrink-0" style={{ color: theme.textSecondary }}>
                      {item.attributes.plate || item.attributes.placa}
                    </span>
                  )}
                  {(item.attributes?.plate || item.attributes?.placa) && item.contact && (
                    <span className="text-[8px] flex-shrink-0" style={{ color: theme.textMuted }}>·</span>
                  )}
                  {item.contact && (
                    <span className="text-[8.5px] font-medium truncate" style={{ color: theme.textSecondary }}>{item.contact}</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex flex-col items-end gap-1 flex-shrink-0">
              <div className="px-2.5 py-1 rounded-xl border" style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}>
                <span className="text-[14px] font-black" style={{ color: isOnline ? theme.textPrimary : theme.textMuted }}>
                  {speedKmh}<span className="text-[10px] ml-1 opacity-40">km/h</span>
                </span>
              </div>
            </div>
            <div
              onClick={(e) => { e.stopPropagation(); isPanelOpen ? onClosePanel?.() : onOpenPanel?.(item.id); }}
              className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 cursor-pointer"
              style={{
                background:   isPanelOpen ? `rgba(${theme.accentRgb},0.15)` : isSelected ? `rgba(${theme.accentRgb},0.08)` : theme.bgSecondary,
                borderColor:  isPanelOpen ? `rgba(${theme.accentRgb},0.6)`  : isSelected ? `rgba(${theme.accentRgb},0.3)`  : theme.borderCard,
                color:        (isPanelOpen || isSelected) ? theme.accent : theme.textMuted,
                transform:    isPanelOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition:   'all 0.25s ease',
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
            {[
              { label: 'Bateria',  value: `${battery}%` },
              { label: 'Odômetro', value: <>{odometer} <span className="text-[8px] opacity-40">km</span></> },
              { label: 'Altitude', value: <>{altitude} <span className="text-[8px] opacity-40">m</span></> },
            ].map(({ label, value }) => (
              <div key={label} className="p-2 rounded-xl border flex flex-col items-center" style={{ background: theme.bgSecondary, borderColor: theme.borderCard, boxShadow: 'var(--hud-nm-inset, none)' }}>
                <span className="text-[8px] font-bold uppercase tracking-tighter" style={{ color: theme.textMuted }}>{label}</span>
                <span className="text-[11px] font-black" style={{ color: theme.textPrimary }}>{value}</span>
              </div>
            ))}
          </div>

          {/* Mini Map */}
          <DeviceMiniMap lat={position?.latitude} lng={position?.longitude} isOnline={isOnline} />

          {/* Action Controls */}
          {!anchorOpen ? (
            <div className="flex flex-col gap-2">
              {/* Anchor status row — shows when anchor exists */}
              {anchor.anchor ? (
                <div
                  className="flex items-center gap-1.5 px-3 h-11 rounded-xl border transition-all duration-300"
                  style={{
                    background:  anchor.anchor.enabled ? `rgba(${theme.accentRgb},0.08)` : theme.bgSecondary,
                    borderColor: anchor.anchor.enabled ? theme.accent : theme.borderCard,
                  }}
                >
                  <AnchorIcon sx={{ fontSize: 15, color: anchor.anchor.enabled ? theme.accent : theme.textMuted }} />
                  <div className="flex flex-col flex-1 min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest leading-none" style={{ color: anchor.anchor.enabled ? theme.accent : theme.textMuted }}>
                      Âncora {anchor.anchor.enabled ? 'Ativa' : 'Desligada'}
                    </span>
                    <span className="text-[8px] leading-none mt-0.5" style={{ color: theme.textMuted }}>
                      {anchor.anchor.radius}m{anchor.anchor.autoBlock ? ' · auto-bloqueio' : ''}
                    </span>
                  </div>
                  {anchor.anchor.enabled && (
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: theme.accent, flexShrink: 0 }} />
                  )}
                  <button
                    onClick={(e) => { e.stopPropagation(); anchor.toggle(); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 active:scale-95"
                    style={{
                      background:  anchor.anchor.enabled ? `rgba(${theme.accentRgb},0.15)` : theme.bgSecondary,
                      borderColor: anchor.anchor.enabled ? theme.accent : theme.borderCard,
                      color:       anchor.anchor.enabled ? theme.accent : theme.textMuted,
                    }}
                    title={anchor.anchor.enabled ? 'Desligar âncora' : 'Ligar âncora'}
                  >
                    <PowerSettingsNewIcon sx={{ fontSize: 15 }} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); anchor.remove(); }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-200 active:scale-95"
                    style={{ background: theme.bgSecondary, borderColor: theme.borderCard, color: theme.textMuted }}
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
                  style={{ background: theme.bgSecondary, borderColor: theme.borderCard, color: theme.textMuted, opacity: !position ? 0.4 : 1 }}
                >
                  <AnchorIcon sx={{ fontSize: 17 }} />
                  <span>Definir Âncora</span>
                </button>
              )}

              {/* Lock button */}
              <button
                onClick={(e) => { e.stopPropagation(); cmd.isBlocked ? cmd.unlock() : cmd.lock(); }}
                disabled={cmd.isPending}
                className="h-11 rounded-xl flex items-center justify-center gap-1.5 font-black uppercase tracking-[1px] text-[10px] transition-all duration-300 border active:scale-95"
                style={{ background: lockBg, borderColor: lockBorder, color: lockColor, opacity: cmd.isPending ? 0.6 : 1 }}
              >
                {cmd.isPending
                  ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : cmd.isBlocked ? <LockOpenIcon sx={{ fontSize: 17 }} /> : <LockIcon sx={{ fontSize: 17 }} />
                }
                <span>{cmd.isBlocked ? 'Liberar Veículo' : 'Bloquear Veículo'}</span>
              </button>
            </div>
          ) : (
            /* ── Anchor Config Panel ── */
            <div
              className="flex flex-col gap-2.5 p-3 rounded-2xl border"
              style={{ background: theme.bgSecondary, borderColor: `rgba(${theme.accentRgb},0.25)` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <AnchorIcon sx={{ fontSize: 14, color: theme.accent }} />
                  <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textSecondary }}>Configurar Âncora</span>
                </div>
                <button onClick={closeAnchorPanel} className="text-xs font-bold transition-colors" style={{ color: theme.textMuted }}>✕</button>
              </div>

              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-bold uppercase tracking-wider px-0.5" style={{ color: theme.textMuted }}>Raio da cerca</span>
                <div className="flex gap-1">
                  {RADII.map((r) => (
                    <button
                      key={r}
                      onClick={() => setAnchorRadius(r)}
                      className="flex-1 h-8 rounded-lg text-[9px] font-black uppercase tracking-wide transition-all duration-150 border"
                      style={{
                        background:  anchorRadius === r ? theme.accent : theme.bgCard,
                        borderColor: anchorRadius === r ? theme.accent : theme.borderCard,
                        color:       anchorRadius === r ? (theme.isDark ? theme.bg : '#fff') : theme.textMuted,
                      }}
                    >
                      {r}m
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setAnchorAutoBlock(!anchorAutoBlock)}
                className="flex items-center justify-between px-3 h-9 rounded-xl border transition-all duration-200"
                style={{
                  background:  anchorAutoBlock ? 'rgba(239,68,68,0.06)' : theme.bgCard,
                  borderColor: anchorAutoBlock ? (theme.isDark ? 'rgba(248,113,113,0.4)' : '#fca5a5') : theme.borderCard,
                }}
              >
                <div className="flex items-center gap-2">
                  <LockIcon sx={{ fontSize: 13, color: anchorAutoBlock ? '#ef4444' : theme.textMuted }} />
                  <span className="text-[9px] font-black uppercase tracking-wide" style={{ color: anchorAutoBlock ? (theme.isDark ? '#f87171' : '#ef4444') : theme.textMuted }}>
                    Bloquear ao sair da cerca
                  </span>
                </div>
                <div className="w-8 h-4 rounded-full transition-all duration-200 flex items-center" style={{ background: anchorAutoBlock ? '#ef4444' : theme.borderCard, padding: '2px' }}>
                  <div className="w-3 h-3 rounded-full shadow-sm transition-all duration-200" style={{ background: '#fff', marginLeft: anchorAutoBlock ? '16px' : '0px' }} />
                </div>
              </button>

              <div className="flex gap-2 mt-0.5">
                <button
                  onClick={closeAnchorPanel}
                  className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider border transition-colors"
                  style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textMuted }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => anchor.create(anchorRadius, anchorAutoBlock).then(() => { if (anchor.status !== 'error') setAnchorOpenId(null); })}
                  disabled={anchor.status === 'loading'}
                  className="flex-1 h-9 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-1.5"
                  style={{
                    background: anchor.status === 'success' ? '#10b981' : anchor.status === 'error' ? '#ef4444' : theme.accent,
                    color:      theme.isDark ? theme.bg : '#fff',
                    opacity:    anchor.status === 'loading' ? 0.7 : 1,
                  }}
                >
                  {anchor.status === 'loading'
                    ? <div className="w-3.5 h-3.5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${theme.isDark ? theme.bg : '#fff'} transparent transparent transparent` }} />
                    : <AnchorIcon sx={{ fontSize: 13 }} />
                  }
                  <span>{anchorBtnLabel}</span>
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
