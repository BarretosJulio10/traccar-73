import React, { useState, useEffect } from 'react';
import { IconButton, Typography, Divider } from '@mui/material';
import { useHudTheme } from '../util/ThemeContext';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import GridViewIcon from '@mui/icons-material/GridView';
import PendingIcon from '@mui/icons-material/Pending';
import CloseIcon from '@mui/icons-material/Close';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import HeightIcon from '@mui/icons-material/Height';
import SpeedIcon from '@mui/icons-material/Speed';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import dayjs from 'dayjs';

const CircularBattery = ({ level, theme }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level / 100) * circumference;
  const color = level > 20 ? theme.accent : '#ef4444';
  const trackColor = theme.isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle cx="48" cy="48" r={radius} stroke={trackColor} strokeWidth="8" fill="transparent" />
        <circle
          cx="48" cy="48" r={radius}
          stroke={color} strokeWidth="8" fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[18px] font-black leading-none" style={{ color: theme.textPrimary }}>
          {Math.round(level)}%
        </span>
        <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
          BATERIA
        </span>
      </div>
    </div>
  );
};

const DataCard = ({ label, value, unit, color, isLarge = false, theme }) => (
  <div className="flex flex-col items-center justify-center p-2 rounded-3xl transition-all duration-300" style={{ flex: 1, minHeight: isLarge ? '100px' : '80px' }}>
    <span className="uppercase tracking-[0.2em] font-black mb-0.5" style={{ color: theme.textMuted, fontSize: '8px', opacity: 0.7 }}>
      {label}
    </span>
    <div className="flex items-baseline gap-0.5">
      <span
        className="font-black tracking-tighter"
        style={{ color: color || theme.textPrimary, fontSize: isLarge ? '56px' : '28px', lineHeight: 1, fontFamily: 'monospace' }}
      >
        {value}
      </span>
      {unit && (
        <span className="font-black uppercase text-[10px]" style={{ color: theme.textMuted, opacity: 0.5 }}>{unit}</span>
      )}
    </div>
  </div>
);

const TelemetryBox = ({ icon, label, value, theme }) => (
  <div
    className="flex flex-col gap-1 p-2.5 rounded-2xl border"
    style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
  >
    <div className="flex items-center gap-1.5" style={{ opacity: 0.7 }}>
      {React.cloneElement(icon, { sx: { fontSize: 12, color: theme.accent } })}
      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme.textSecondary }}>{label}</span>
    </div>
    <span className="text-[12px] font-black truncate" style={{ color: theme.textPrimary }}>{value}</span>
  </div>
);

const InnovatorHUD = ({ device, position, onClose, onCommand }) => {
  const { theme } = useHudTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [isBlockedLocal, setIsBlockedLocal] = useState(device?.attributes?.blocked ?? false);
  const [isLockPending, setIsLockPending] = useState(false);

  useEffect(() => {
    if (!isLockPending) setIsBlockedLocal(device?.attributes?.blocked ?? false);
  }, [device?.attributes?.blocked, isLockPending]);

  const handleLockToggle = async () => {
    const willBlock = !isBlockedLocal;
    setIsBlockedLocal(willBlock);
    setIsLockPending(true);
    try {
      await onCommand(willBlock ? 'block' : 'unblock');
    } catch (_) {
      setIsBlockedLocal(!willBlock);
    } finally {
      setIsLockPending(false);
    }
  };

  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientY);

  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientY;
    const distance = touchStart - touchEnd;
    if (distance > 50 && !isExpanded) setIsExpanded(true);
    if (distance < -50 && isExpanded) setIsExpanded(false);
    setTouchStart(null);
  };

  const attrs = position?.attributes || {};
  const speed = position ? Math.round(position.speed * 1.852) : 0;
  const battery = attrs.batteryLevel || attrs.battery || 0;
  const odometer = position?.attributes?.totalDistance
    ? (position.attributes.totalDistance / 1000).toFixed(1)
    : position?.attributes?.odometer
      ? (position.attributes.odometer / 1000).toFixed(1)
      : '0.0';
  const satellites = attrs.sat || 0;
  const altitude = position?.altitude ? Math.round(position.altitude) : 0;
  const ignition = attrs.ignition;
  const isOnline = device?.status === 'online';
  const timeGPS = position ? dayjs(position.fixTime).format('HH:mm') : '--:--';

  // Semantic lock button colors — adapt to dark/light
  const lockBg = isBlockedLocal
    ? (theme.isDark ? 'rgba(74,222,128,0.12)' : '#dcfce7')
    : (theme.isDark ? 'rgba(248,113,113,0.12)' : '#fee2e2');
  const lockBorder = isBlockedLocal
    ? (theme.isDark ? 'rgba(74,222,128,0.3)' : '#86efac')
    : (theme.isDark ? 'rgba(248,113,113,0.3)' : '#fca5a5');
  const lockColor = isBlockedLocal
    ? (theme.isDark ? '#4ade80' : '#16a34a')
    : (theme.isDark ? '#f87171' : '#dc2626');

  return (
    <div
      className="fixed bottom-0 left-0 right-0 overflow-hidden flex flex-col transition-all duration-500 ease-in-out"
      style={{
        zIndex: 1000,
        height: isExpanded ? '85vh' : '50vh',
        maxHeight: '100vh',
        borderRadius: '32px 32px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        boxShadow: theme.isDark ? '0 -15px 50px rgba(0,0,0,0.6)' : '0 -15px 50px rgba(0,0,0,0.08)',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
        background: theme.bgCard,
        borderTop: `1px solid ${theme.borderCard}`,
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Drag Handle */}
      <div
        className="flex flex-col items-center justify-center py-3 cursor-grab active:cursor-grabbing w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-14 h-1.5 rounded-full" style={{ background: theme.isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }} />
      </div>

      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ background: theme.accent }} />
          <div className="flex flex-col">
            <span className="font-black leading-none" style={{ color: theme.textPrimary, fontSize: '20px', letterSpacing: '-0.03em' }}>
              {device?.name}
            </span>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`} style={{ background: isOnline ? theme.accent : theme.textMuted }} />
              <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
                {isOnline ? 'Acoplado / Rastreando' : 'Desconectado'}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-xl flex items-center justify-center border transition-colors"
          style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
        >
          <CloseIcon sx={{ fontSize: 18, color: theme.textSecondary }} />
        </button>
      </div>

      {/* Main Content */}
      <div className={`flex-1 flex flex-col no-scrollbar ${!isExpanded ? 'overflow-hidden' : 'overflow-y-auto py-2'}`}>
        {/* Hero Row: Circular Battery + Speed + Signal */}
        <div className="flex items-center justify-around px-4 py-4">
          <CircularBattery level={battery} theme={theme} />
          <div className="flex flex-col items-center">
            <DataCard label="VELOCIDADE" value={speed} unit="KM/H" isLarge theme={theme} />
          </div>
          <div className="w-24 h-24 flex items-center justify-center">
            <div className="flex flex-col items-center" style={{ opacity: 0.5 }}>
              <GpsFixedIcon sx={{ fontSize: 18, mb: 0.5, color: theme.textMuted }} />
              <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>SINAL</span>
              <span className="text-[12px] font-black" style={{ color: theme.textPrimary }}>{attrs.rssi || 0}dB</span>
            </div>
          </div>
        </div>

        {/* Block / Unblock */}
        <div className="px-6 mb-6">
          <button
            onClick={handleLockToggle}
            disabled={isLockPending}
            className="w-full h-14 rounded-2xl flex items-center justify-center gap-3 font-black uppercase tracking-[2px] text-[11px] transition-all duration-300 border active:scale-95 shadow-sm"
            style={{ background: lockBg, borderColor: lockBorder, color: lockColor, opacity: isLockPending ? 0.6 : 1 }}
          >
            {isLockPending
              ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              : isBlockedLocal ? <LockOpenIcon sx={{ fontSize: 22 }} /> : <LockIcon sx={{ fontSize: 22 }} />
            }
            <span>{isBlockedLocal ? 'Liberar Veículo' : 'Bloquear Veículo'}</span>
          </button>
        </div>

        {/* Telemetry Grid */}
        <div className="px-6 grid grid-cols-3 gap-3 mb-6">
          <TelemetryBox icon={<HeightIcon />} label="ALTITUDE" value={`${altitude}m`} theme={theme} />
          <TelemetryBox icon={<MapIcon />} label="ODÔMETRO" value={`${odometer}km`} theme={theme} />
          <TelemetryBox icon={<SatelliteAltIcon />} label="SATÉLITES" value={satellites} theme={theme} />
          <TelemetryBox
            icon={<SpeedIcon />} label="HORÍMETRO"
            value={`${attrs.hours ? Math.round(attrs.hours / 3600000) : 0}h`}
            theme={theme}
          />
          <TelemetryBox
            icon={<InfoIcon />} label="IGNIÇÃO"
            value={ignition ? 'LIGADA' : 'DESLIG'}
            theme={{ ...theme, accent: ignition ? '#10b981' : theme.textMuted }}
          />
          <TelemetryBox
            icon={<InfoIcon />} label="POSIÇÃO"
            value={attrs.motion ? 'MOVENDO' : 'PARADO'}
            theme={{ ...theme, accent: attrs.motion ? '#3b82f6' : theme.textMuted }}
          />
        </div>

        {/* Address Card */}
        <div
          className="mx-6 p-4 rounded-3xl flex items-center gap-4 mb-6 border"
          style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
        >
          <div
            className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: `rgba(${theme.accentRgb},0.12)` }}
          >
            <MapIcon sx={{ color: theme.accent, fontSize: 20 }} />
          </div>
          <div className="flex-1 min-w-0">
            <span className="block text-[10px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>LOCALIZAÇÃO ATUAL</span>
            <span className="block text-[13px] font-bold truncate" style={{ color: theme.textPrimary }}>{position?.address || 'Buscando endereço...'}</span>
          </div>
        </div>

        {isExpanded && (
          <div className="px-6 pb-12">
            <Divider sx={{ mb: 4, borderColor: theme.borderCard }} />
            <div className="grid grid-cols-4 gap-4 mb-8">
              {[
                { icon: <GridViewIcon />, label: 'Histórico', path: `/app/replay?deviceId=${device?.id}` },
                { icon: <EditIcon />, label: 'Editar', path: `/app/settings/device/${device?.id}` },
                { icon: <ShareIcon />, label: 'Partilhar', path: `/app/settings/device/${device?.id}/share` },
                { icon: <PendingIcon />, label: 'Config', path: '/app/settings/device' },
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="flex flex-col items-center gap-2 cursor-pointer"
                  onClick={() => { onClose(); navigate(item.path); }}
                >
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center border"
                    style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
                  >
                    {React.cloneElement(item.icon, { sx: { fontSize: 22, color: theme.textSecondary } })}
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
            <span className="block text-center text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
              Última atualização: {timeGPS}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default InnovatorHUD;
