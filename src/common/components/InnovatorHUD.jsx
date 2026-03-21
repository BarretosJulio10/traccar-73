import React, { useState } from 'react';
import { IconButton, Typography, Button, Divider } from '@mui/material';
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

const DataCard = ({ label, value, unit, color, isLarge = false }) => (
  <div
    className="flex flex-col items-center justify-center p-2 rounded-2xl border transition-all duration-300"
    style={{
      background: 'rgba(255,255,255,0.03)',
      borderColor: 'rgba(255,255,255,0.05)',
      flex: 1,
      minHeight: isLarge ? '90px' : '70px',
    }}
  >
    <Typography
      className="uppercase tracking-[0.2em] font-black opacity-30 mb-0.5"
      style={{ color: '#fff', fontSize: '7px' }}
    >
      {label}
    </Typography>
    <div className="flex items-baseline gap-0.5">
      <span
        className="font-black tracking-tighter"
        style={{
          color: color || '#fff',
          fontSize: isLarge ? '44px' : '22px',
          lineHeight: 1,
          fontFamily: 'monospace',
        }}
      >
        {value}
      </span>
      {unit && (
        <span className="font-black opacity-20 uppercase text-[8px]" style={{ color: '#fff' }}>
          {unit}
        </span>
      )}
    </div>
  </div>
);

const TelemetryBox = ({ icon, label, value, theme }) => (
  <div
    className="flex flex-col gap-1 p-2 rounded-xl border"
    style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.05)' }}
  >
    <div className="flex items-center gap-1.5 opacity-40">
      {React.cloneElement(icon, { sx: { fontSize: 10, color: theme.accent } })}
      <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#fff' }}>
        {label}
      </span>
    </div>
    <span className="text-[11px] font-black truncate" style={{ color: '#fff' }}>
      {value}
    </span>
  </div>
);

const InnovatorHUD = ({ device, position, onClose, onCommand }) => {
  const { theme } = useHudTheme();
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const attrs = position?.attributes || {};
  const speed = position ? Math.round(position.speed * 1.852) : 0;
  const battery = attrs.batteryLevel || attrs.battery || 0;
  const batteryVolts = attrs.battery ? `${attrs.battery}V` : null;
  const odometer = position?.attributes?.totalDistance
    ? (position.attributes.totalDistance / 1000).toFixed(1)
    : position?.attributes?.odometer
      ? (position.attributes.odometer / 1000).toFixed(1)
      : '0.0';
  const satellites = attrs.sat || 0;
  const altitude = position?.altitude ? Math.round(position.altitude) : 0;
  const protocol = device?.protocol || attrs.protocol || '---';
  const ignition = attrs.ignition;
  const isOnline = device?.status === 'online';
  const direction = position?.course || 0;

  const timeGPS = position ? dayjs(position.fixTime).format('DD/MM HH:mm:ss') : '---';
  const timeGSM = position ? dayjs(position.deviceTime).format('DD/MM HH:mm:ss') : '---';

  const accentColor = theme.accent;
  const secondaryAccent = theme.accentSecondary;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 overflow-hidden flex flex-col transition-all duration-500 ease-in-out bg-[#060708] border-t border-white/5"
      style={{
        zIndex: 1000,
        height: isExpanded ? 'auto' : '50vh',
        maxHeight: '100vh',
        paddingBottom: isExpanded ? 'env(safe-area-inset-bottom, 24px)' : 'calc(env(safe-area-inset-bottom, 24px) + 10px)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.95), 0 0 40px rgba(0,0,0,0.5)',
        touchAction: 'none',
        display: 'flex',
        flexDirection: 'column',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      {/* Drag Handle & Gesture Area */}
      <div
        className="flex flex-col items-center justify-center py-2 cursor-grab active:cursor-grabbing w-full"
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ background: 'rgba(255,255,255,0.02)' }}
      >
        <div className="w-12 h-1 rounded-full bg-white/20 mb-1" />
        {!isExpanded && (
          <span className="text-[6px] font-black uppercase tracking-[0.3em] opacity-30">
            Arraste para Detalhes
          </span>
        )}
      </div>

      {/* Top Bar */}
      <div
        className={`flex justify-between items-center px-6 transition-all duration-500 ${isExpanded ? 'py-4 border-b border-white/5 bg-white/5' : 'py-1'}`}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-4 rounded-full"
            style={{ background: accentColor, height: isExpanded ? '24px' : '16px' }}
          />
          <div className="flex flex-col">
            <Typography
              className="font-black uppercase tracking-tight"
              style={{ color: '#fff', fontSize: isExpanded ? '16px' : '12px' }}
            >
              {isExpanded ? device?.name : device?.name?.split(' ')[0]}
            </Typography>
            {isExpanded && (
              <Typography
                className="text-[9px] font-bold opacity-40 tracking-widest"
                style={{ color: '#fff' }}
              >
                ID: {device?.uniqueId} • {protocol}
              </Typography>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-2 ${isExpanded ? 'px-3 py-1 rounded-full border border-white/10' : ''}`}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
              style={{ background: isOnline ? accentColor : '#555' }}
            />
            {isExpanded && (
              <span
                className="text-[9px] font-black uppercase tracking-widest"
                style={{ color: isOnline ? accentColor : '#555' }}
              >
                {isOnline ? 'Online' : 'Offline'}
              </span>
            )}
          </div>
          <IconButton
            size="small"
            onClick={onClose}
            style={{
              color: '#fff',
              background: 'rgba(255,255,255,0.05)',
              padding: isExpanded ? '6px' : '2px',
            }}
          >
            <CloseIcon sx={{ fontSize: isExpanded ? 20 : 14 }} />
          </IconButton>
        </div>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 flex flex-col no-scrollbar ${!isExpanded ? 'justify-start pt-4' : 'overflow-y-auto py-2'}`}>
        {/* Primary Data Row */}
        <div className="flex justify-between items-center px-4 gap-3 mb-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center border bg-white/[0.03] border-white/10 text-[#10b981]"
            onClick={() => onCommand('unblock')}
          >
            <LockOpenIcon sx={{ fontSize: 20 }} />
          </div>

          <div className="flex flex-1 justify-around items-center gap-2">
            <DataCard label="BATERIA" value={Math.round(battery)} unit="%" color={battery > 20 ? secondaryAccent : '#ef4444'} />
            <DataCard label="VELOCIDADE" value={speed} unit="KM/H" color={accentColor} isLarge />
            <DataCard label="RUMO" value={direction} unit="°" color={accentColor} />
          </div>

          <div
            className="w-12 h-12 rounded-full flex items-center justify-center border bg-white/[0.03] border-white/10 text-[#ef4444]"
            onClick={() => onCommand('block')}
          >
            <LockIcon sx={{ fontSize: 20 }} />
          </div>
        </div>

        {/* Telemetry Grid (3-Column Optimization) */}
        <div className="px-5 grid grid-cols-3 gap-2 mb-4 animate-in fade-in duration-500">
          <TelemetryBox icon={<HeightIcon />} label="ALTITUDE" value={`${altitude}m`} theme={theme} />
          <TelemetryBox icon={<MapIcon />} label="ODÔMETRO" value={`${odometer}km`} theme={theme} />
          <TelemetryBox icon={<SatelliteAltIcon />} label="SATS" value={satellites} theme={theme} />
          <TelemetryBox
            icon={<SpeedIcon />}
            label="MOTOR"
            value={`${attrs.hours ? Math.round(attrs.hours / 3600000) : 0}h`}
            theme={theme}
          />
          <TelemetryBox
            icon={<InfoIcon />}
            label="ESTADO"
            value={ignition ? 'LIGADO' : 'DESLIG'}
            theme={{ accent: ignition ? '#10b981' : '#555' }}
          />
          <TelemetryBox
            icon={<InfoIcon />}
            label="MOVIM."
            value={attrs.motion ? 'MOVENDO' : 'PARADO'}
            theme={{ accent: attrs.motion ? '#3b82f6' : '#555' }}
          />
          <TelemetryBox
            icon={<GpsFixedIcon />}
            label="PRECISÃO"
            value={`${attrs.hdop || 1.0}m`}
            theme={theme}
          />
          <TelemetryBox
            icon={<GpsFixedIcon />}
            label="SINAL"
            value={`${attrs.rssi || 0}dB`}
            theme={theme}
          />
          <TelemetryBox
            icon={<InfoIcon />}
            label="POWER"
            value={`${attrs.power || '---'}V`}
            theme={theme}
          />
          <div className="col-span-3">
            <TelemetryBox
              icon={<GpsFixedIcon />}
              label="COORDENADAS"
              value={`${position?.latitude?.toFixed(5)}, ${position?.longitude?.toFixed(5)}`}
              theme={theme}
            />
          </div>
        </div>

        {/* Expanded Sections */}
        {isExpanded && (
          <div className="animate-in fade-in duration-500 px-6">
            <div className="py-3 px-4 rounded-2xl border flex items-center gap-4 bg-white/[0.02] border-white/5 mb-6">
              <InfoIcon sx={{ color: accentColor, fontSize: 18 }} />
              <div className="flex-1 min-w-0">
                <span className="text-[8px] font-black uppercase opacity-40 tracking-[0.2em]" style={{ color: '#fff' }}>
                  Endereço Atual
                </span>
                <Typography className="text-[12px] font-bold truncate" style={{ color: '#fff' }}>
                  {position?.address || 'Processando endereço...'}
                </Typography>
              </div>
            </div>

            {/* Times */}
            <div className="flex justify-between items-center opacity-30 mb-8 px-2">
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#fff' }}>GPS TIME</span>
                <span className="text-[9px] font-bold" style={{ color: '#fff' }}>{timeGPS}</span>
              </div>
              <Divider orientation="vertical" flexItem sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
              <div className="flex flex-col items-center">
                <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#fff' }}>DEVICE TIME</span>
                <span className="text-[9px] font-bold" style={{ color: '#fff' }}>{timeGSM}</span>
              </div>
            </div>

            <Button
              fullWidth
              onClick={() => setIsExpanded(false)}
              className="rounded-xl py-2 border transition-all duration-300 active:scale-95 mb-6"
              style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.05)', color: accentColor }}
            >
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Ver menos</span>
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Actions - Only Expanded */}
      {isExpanded && (
        <div className="px-6 py-6 border-t border-white/5 bg-black/40 backdrop-blur-md animate-in slide-in-from-bottom duration-500">
          <div className="grid grid-cols-2 gap-4">
            <Button
              fullWidth
              onClick={() => onCommand('unblock')}
              className="rounded-2xl py-3 border transition-all duration-300 active:scale-95"
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                borderColor: 'rgba(16, 185, 129, 0.2)',
                color: '#10b981',
              }}
            >
              <LockOpenIcon sx={{ mr: 1, fontSize: 18 }} />
              <span className="text-[11px] font-black uppercase tracking-widest">DESBLOQUEAR</span>
            </Button>
            <Button
              fullWidth
              onClick={() => onCommand('block')}
              className="rounded-2xl py-3 border transition-all duration-300 active:scale-95"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                borderColor: 'rgba(239, 68, 129, 0.2)',
                color: '#ef4444',
              }}
            >
              <LockIcon sx={{ mr: 1, fontSize: 18 }} />
              <span className="text-[11px] font-black uppercase tracking-widest">BLOQUEAR</span>
            </Button>
          </div>
          <div className="flex justify-around items-center mt-6 px-4">
            {[
              { icon: <GridViewIcon />, label: 'Histórico', path: `/app/replay?deviceId=${device?.id}` },
              { icon: <EditIcon />, label: 'Editar', path: `/app/settings/device/${device?.id}` },
              { icon: <ShareIcon />, label: 'Partilhar', path: `/app/settings/device/${device?.id}/share` },
              { icon: <PendingIcon />, label: 'Mais', path: '/app/settings/device' },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center gap-2 opacity-50 active:opacity-100"
                onClick={() => navigate(item.path)}
              >
                {React.cloneElement(item.icon, { sx: { fontSize: 20, color: '#fff' } })}
                <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: '#fff' }}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default InnovatorHUD;
