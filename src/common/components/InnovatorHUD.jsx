import React, { useState } from 'react';
import { IconButton, Typography, Button, Divider, Box, Card } from '@mui/material';
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
import SlideAction from './SlideAction';

const CircularBattery = ({ level, theme }) => {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (level / 100) * circumference;
  const color = level > 20 ? theme.accent : '#ef4444';

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="transform -rotate-90 w-24 h-24">
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke="rgba(0,0,0,0.03)"
          strokeWidth="8"
          fill="transparent"
        />
        <circle
          cx="48"
          cy="48"
          r={radius}
          stroke={color}
          strokeWidth="8"
          fill="transparent"
          strokeDasharray={circumference}
          style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-[18px] font-black leading-none" style={{ color: '#0f172a' }}>
          {Math.round(level)}%
        </span>
        <span className="text-[7px] font-bold opacity-40 uppercase tracking-widest" style={{ color: '#475569' }}>
          BATERIA
        </span>
      </div>
    </div>
  );
};

const DataCard = ({ label, value, unit, color, isLarge = false }) => (
  <div
    className="flex flex-col items-center justify-center p-2 rounded-3xl transition-all duration-300"
    style={{
      flex: 1,
      minHeight: isLarge ? '100px' : '80px',
    }}
  >
    <Typography
      className="uppercase tracking-[0.2em] font-black opacity-30 mb-0.5"
      style={{ color: '#475569', fontSize: '8px' }}
    >
      {label}
    </Typography>
    <div className="flex items-baseline gap-0.5">
      <span
        className="font-black tracking-tighter"
        style={{
          color: color || '#0f172a',
          fontSize: isLarge ? '56px' : '28px',
          lineHeight: 1,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </span>
      {unit && (
        <span className="font-black opacity-30 uppercase text-[10px]" style={{ color: '#475569' }}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

const TelemetryBox = ({ icon, label, value, theme }) => (
  <div
    className="flex flex-col gap-1 p-2.5 rounded-2xl border"
    style={{ background: '#F8FAFC', borderColor: 'rgba(0,0,0,0.03)' }}
  >
    <div className="flex items-center gap-1.5 opacity-60">
      {React.cloneElement(icon, { sx: { fontSize: 12, color: theme.accent } })}
      <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: '#475569' }}>
        {label}
      </span>
    </div>
    <span className="text-[12px] font-black truncate" style={{ color: '#0f172a' }}>
      {value}
    </span>
  </div>
);

const InnovatorHUD = ({ device, position, onClose, onCommand }) => {
  const { theme } = useHudTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  const onTouchStart = (e) => {
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientY;
    const distance = touchStart - touchEnd;
    const isSwipeUp = distance > 50;
    const isSwipeDown = distance < -50;

    if (isSwipeUp && !isExpanded) setIsExpanded(true);
    if (isSwipeDown && isExpanded) setIsExpanded(false);
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

  const accentColor = theme.accent;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 overflow-hidden flex flex-col transition-all duration-500 ease-in-out bg-white"
      style={{
        zIndex: 1000,
        height: isExpanded ? '85vh' : '50vh',
        maxHeight: '100vh',
        borderRadius: '32px 32px 0 0',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        boxShadow: '0 -15px 50px rgba(0,0,0,0.08)',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Drag Handle Area */}
      <div
        className="flex flex-col items-center justify-center py-3 cursor-grab active:cursor-grabbing w-full"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="w-14 h-1.5 rounded-full bg-slate-200" />
      </div>

      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 py-2">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ background: accentColor }} />
          <div className="flex flex-col">
            <Typography className="font-black text-slate-900 leading-none" style={{ fontSize: '20px', letterSpacing: '-0.03em' }}>
              {device?.name}
            </Typography>
            <div className="flex items-center gap-2 mt-1">
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-cyan-500 animate-pulse' : 'bg-slate-300'}`} />
              <Typography className="text-[10px] font-black uppercase tracking-widest opacity-40">
                {isOnline ? 'Acoplado / Rastreando' : 'Desconectado'}
              </Typography>
            </div>
          </div>
        </div>
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ background: '#F1F5F9', '&:hover': { background: '#E2E8F0' } }}
        >
          <CloseIcon sx={{ fontSize: 20, color: '#475569' }} />
        </IconButton>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col no-scrollbar ${!isExpanded ? 'overflow-hidden' : 'overflow-y-auto py-2'}`}>
        {/* Hero Row: Circular Battery + Speed */}
        <div className="flex items-center justify-around px-4 py-4">
          <CircularBattery level={battery} theme={theme} />
          <div className="flex flex-col items-center">
             <DataCard label="VELOCIDADE" value={speed} unit="KM/H" color="#0f172a" isLarge />
          </div>
          <div className="w-24 h-24 flex items-center justify-center">
             <div className="flex flex-col items-center opacity-40">
                <GpsFixedIcon sx={{ fontSize: 18, mb: 0.5 }} />
                <span className="text-[8px] font-black uppercase tracking-widest">SINAL</span>
                <span className="text-[12px] font-black">{attrs.rssi || 0}dB</span>
             </div>
          </div>
        </div>

        {/* Quick Actions (SlideToUnlock for critical actions) */}
        <div className="px-6 flex flex-col gap-3 mb-6">
           <SlideAction
             type="unblock"
             onComplete={() => onCommand('engineResume')}
             theme={theme}
           />
           <SlideAction
             type="block"
             onComplete={() => onCommand('engineStop')}
             theme={theme}
           />
        </div>

        {/* Telemetry Grid */}
        <div className="px-6 grid grid-cols-3 gap-3 mb-6">
          <TelemetryBox icon={<HeightIcon />} label="ALTITUDE" value={`${altitude}m`} theme={theme} />
          <TelemetryBox icon={<MapIcon />} label="ODÔMETRO" value={`${odometer}km`} theme={theme} />
          <TelemetryBox icon={<SatelliteAltIcon />} label="SATÉLITES" value={satellites} theme={theme} />
          <TelemetryBox
            icon={<SpeedIcon />}
            label="HORÍMETRO"
            value={`${attrs.hours ? Math.round(attrs.hours / 3600000) : 0}h`}
            theme={theme}
          />
          <TelemetryBox
            icon={<InfoIcon />}
            label="IGNIÇÃO"
            value={ignition ? 'LIGADA' : 'DESLIG'}
            theme={{ accent: ignition ? '#10b981' : '#94a3b8' }}
          />
          <TelemetryBox
            icon={<InfoIcon />}
            label="POSIÇÃO"
            value={attrs.motion ? 'MOVENDO' : 'PARADO'}
            theme={{ accent: attrs.motion ? '#3b82f6' : '#94a3b8' }}
          />
        </div>

        {/* Info Card */}
        <div className="mx-6 p-4 rounded-3xl bg-slate-50 border border-slate-100 flex items-center gap-4 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-cyan-100 flex items-center justify-center">
            <MapIcon sx={{ color: 'cyan.500', fontSize: 20 }} />
          </div>
          <div className="flex-1 min-w-0">
            <Typography className="text-[10px] font-black uppercase tracking-widest opacity-40">LOCALIZAÇÃO ATUAL</Typography>
            <Typography className="text-[13px] font-bold truncate text-slate-900">{position?.address || 'Buscando endereço...'}</Typography>
          </div>
        </div>

        {isExpanded && (
          <div className="px-6 pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <Divider sx={{ mb: 4, borderColor: 'rgba(0,0,0,0.04)' }} />
             <div className="grid grid-cols-4 gap-4 mb-8">
               {[
                 { icon: <GridViewIcon />, label: 'Histórico', path: `/app/replay?deviceId=${device?.id}` },
                 { icon: <EditIcon />, label: 'Editar', path: `/app/settings/device/${device?.id}` },
                 { icon: <ShareIcon />, label: 'Partilhar', path: `/app/settings/device/${device?.id}/share` },
                 { icon: <PendingIcon />, label: 'Config', path: '/app/settings/device' },
               ].map((item, idx) => (
                 <div
                   key={idx}
                   className="flex flex-col items-center gap-2 group cursor-pointer"
                   onClick={() => navigate(item.path)}
                 >
                   <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center group-hover:bg-cyan-50 transition-colors">
                     {React.cloneElement(item.icon, { sx: { fontSize: 22, color: '#64748b' } })}
                   </div>
                   <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 group-hover:text-cyan-500">
                     {item.label}
                   </span>
                 </div>
               ))}
             </div>
             <Typography className="text-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
               Última atualização: {timeGPS}
             </Typography>
          </div>
        )}
      </div>
    </div>
  );
};

export default InnovatorHUD;
