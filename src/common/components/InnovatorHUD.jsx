import React, { useState } from 'react';
import { IconButton, Typography, Button, Grid, Divider } from '@mui/material';
import { useTranslation } from './LocalizationProvider';
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
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NavigationIcon from '@mui/icons-material/Navigation';
import HeightIcon from '@mui/icons-material/Height';
import SpeedIcon from '@mui/icons-material/Speed';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import MapIcon from '@mui/icons-material/Map';
import dayjs from 'dayjs';

const ArcGauge = ({
  value,
  max,
  label,
  unit,
  subtext,
  color,
  trackColor,
  size = 120,
  thickness = 10,
  fontSize = 24,
}) => {
  const radius = (size - thickness) / 2;
  const center = size / 2;
  // Semi-circle arc (from -210deg to 30deg roughly, or 180deg)
  const startAngle = -220;
  const endAngle = 40;
  const angleRange = endAngle - startAngle;
  const currentAngle = startAngle + (Math.min(value, max) / max) * angleRange;

  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x, y, radius, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    return ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(' ');
  };

  // Correcting ticks generation logic
  const ticks = [];
  const numTicks = 20;
  for (let i = 0; i <= numTicks; i++) {
    const angle = startAngle + (i / numTicks) * angleRange;
    const p1 = polarToCartesian(center, center, radius + 2, angle);
    const p2 = polarToCartesian(center, center, radius + (i % 5 === 0 ? 10 : 5), angle);
    ticks.push(
      <line
        key={i}
        x1={p1.x}
        y1={p1.y}
        x2={p2.x}
        y2={p2.y}
        stroke="rgba(255,255,255,0.15)"
        strokeWidth={1}
      />,
    );
  }

  return (
    <div
      className="flex flex-col items-center justify-center relative"
      style={{ width: size, height: size * 0.85 }}
    >
      <svg width={size} height={size} className="absolute top-0">
        {/* Ticks */}
        {ticks}
        {/* Background Track */}
        <path
          d={describeArc(center, center, radius, startAngle, endAngle)}
          fill="none"
          stroke={trackColor}
          strokeWidth={thickness}
          strokeLinecap="round"
          style={{ opacity: 0.2 }}
        />
        {/* Value Fill */}
        <path
          d={describeArc(center, center, radius, startAngle, currentAngle)}
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          style={{
            transition: 'd 0.8s ease-out',
            filter: `drop-shadow(0 0 5px ${color})`,
          }}
        />
      </svg>
      <div className="absolute top-[35%] flex flex-col items-center justify-center w-full">
        <div className="flex items-baseline justify-center">
          <span
            className="font-black italic tracking-tighter leading-none"
            style={{ color: '#fff', fontSize, filter: `drop-shadow(0 0 10px ${color})` }}
          >
            {Math.round(value)}
          </span>
          {unit && (
            <span
              className="ml-1 font-black italic opacity-40 uppercase"
              style={{ color: '#fff', fontSize: fontSize * 0.25 }}
            >
              {unit}
            </span>
          )}
        </div>
        <span
          className="uppercase tracking-[0.3em] font-black opacity-30 text-[6px] mt-1"
          style={{ color: '#fff' }}
        >
          {label}
        </span>
        {subtext && (
          <span
            className="text-[7px] font-black mt-1 opacity-80 uppercase tracking-widest px-2 py-0.5 rounded-full"
            style={{ background: `${color}15`, color }}
          >
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
};

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
      className="fixed bottom-0 left-0 right-0 overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-700 bg-[#060708] border-t border-white/5"
      style={{
        zIndex: 1000,
        maxHeight: '100vh',
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        boxShadow: '0 -20px 60px rgba(0,0,0,0.9)',
      }}
    >
      {/* Top Bar - High Precision */}
      <div className="flex justify-between items-center px-6 py-4 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-6 rounded-full" style={{ background: accentColor }} />
          <div className="flex flex-col">
            <Typography
              className="text-[16px] font-black uppercase tracking-tight"
              style={{ color: '#fff' }}
            >
              {device?.name}
            </Typography>
            <Typography
              className="text-[9px] font-bold opacity-40 tracking-widest"
              style={{ color: '#fff' }}
            >
              ID: {device?.uniqueId} • {protocol}
            </Typography>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-3 py-1 rounded-full border border-white/10 flex items-center gap-2">
            <div
              className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'animate-pulse' : ''}`}
              style={{ background: isOnline ? accentColor : '#555' }}
            />
            <span
              className="text-[9px] font-black uppercase tracking-widest"
              style={{ color: isOnline ? accentColor : '#555' }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <IconButton
            size="small"
            onClick={onClose}
            style={{ color: '#fff', background: 'rgba(255,255,255,0.05)' }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-6">
        {/* Gauges Hub - Image 2 Style */}
        <div className="flex justify-around items-end px-4 gap-2 mb-8 h-[160px]">
          {/* Left Arc: Battery */}
          <div className="flex-1 flex justify-center">
            <ArcGauge
              value={battery}
              max={100}
              label="BATERIA"
              unit="%"
              subtext={batteryVolts}
              size={100}
              thickness={6}
              color={battery > 20 ? secondaryAccent : '#ef4444'}
              trackColor="rgba(255,255,255,0.1)"
              fontSize={22}
            />
          </div>

          {/* Center Arc: SPEED */}
          <div className="flex-[1.5] flex justify-center">
            <ArcGauge
              value={speed}
              max={160}
              label="SPEED"
              unit="km/h"
              size={160}
              thickness={10}
              color={accentColor}
              trackColor="rgba(255,255,255,0.1)"
              fontSize={52}
            />
          </div>

          {/* Right Arc: Movement/Direction */}
          <div className="flex-1 flex justify-center">
            <ArcGauge
              value={direction}
              max={360}
              label="DIREÇÃO"
              unit="°"
              subtext={ignition ? 'MOTOR ON' : 'MOTOR OFF'}
              size={100}
              thickness={6}
              color={ignition ? accentColor : '#555'}
              trackColor="rgba(255,255,255,0.1)"
              fontSize={22}
            />
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex flex-wrap justify-center gap-2 px-6 mb-8">
          {[
            { label: ignition ? 'LIGADO' : 'DESLIGADO', color: ignition ? '#10b981' : '#555' },
            {
              label: attrs.motion ? 'MOVENDO' : 'PARADO',
              color: attrs.motion ? '#3b82f6' : '#555',
            },
            {
              label: attrs.blocked ? 'BLOQUEADO' : 'DESBLOQ.',
              color: attrs.blocked ? '#ef4444' : '#10b981',
            },
            {
              label: position?.geofenceIds?.length > 0 ? 'ÂNCORA ATIVA' : 'ÂNCORA OFF',
              color: '#8b5cf6',
              hide: !position?.geofenceIds?.length,
            },
          ]
            .filter((c) => !c.hide)
            .map((chip, idx) => (
              <div
                key={idx}
                className="px-3 py-1 rounded-lg border text-[8px] font-black tracking-widest transition-all duration-300"
                style={{
                  background: `${chip.color}15`,
                  borderColor: `${chip.color}30`,
                  color: chip.color,
                }}
              >
                {chip.label}
              </div>
            ))}
        </div>
        {/* Address Section - Always Visible */}
        <div className="px-6 mb-4">
          <div className="py-3 px-4 rounded-2xl border flex items-center gap-4 bg-white/[0.02] border-white/5">
            <InfoIcon sx={{ color: accentColor, fontSize: 18 }} />
            <div className="flex-1 min-w-0">
              <span
                className="text-[8px] font-black uppercase opacity-40 tracking-[0.2em]"
                style={{ color: '#fff' }}
              >
                Localização Atual
              </span>
              <Typography className="text-[12px] font-bold truncate" style={{ color: '#fff' }}>
                {position?.address || 'Processando endereço...'}
              </Typography>
            </div>
          </div>
        </div>

        {/* Expand/Collapse Trigger */}
        <div className="px-6 mb-4">
          <Button
            fullWidth
            onClick={() => setIsExpanded(!isExpanded)}
            className="rounded-xl py-2 border transition-all duration-300 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.03)',
              borderColor: 'rgba(255,255,255,0.05)',
              color: accentColor,
            }}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.2em]">
              {isExpanded ? 'Ver menos' : 'Ver mais detalhes'}
            </span>
          </Button>
        </div>

        {isExpanded && (
          <>
            {/* Telemetry Grid (All Data from Image 1) */}
            <div className="px-6 grid grid-cols-2 gap-3 mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <TelemetryBox
                icon={<HeightIcon />}
                label="ALTITUDE"
                value={`${altitude} m`}
                theme={theme}
              />
              <TelemetryBox
                icon={<MapIcon />}
                label="ODÔMETRO"
                value={`${odometer} km`}
                theme={theme}
              />
              <TelemetryBox
                icon={<SatelliteAltIcon />}
                label="SATÉLITES"
                value={satellites}
                theme={theme}
              />
              <TelemetryBox
                icon={<SpeedIcon />}
                label="HORÍMETRO"
                value={`${attrs.hours ? Math.round(attrs.hours / 3600000) : 0} h`}
                theme={theme}
              />
              <div className="col-span-2">
                <TelemetryBox
                  icon={<GpsFixedIcon />}
                  label="COORDENADAS"
                  value={`${position?.latitude?.toFixed(5)}, ${position?.longitude?.toFixed(5)}`}
                  theme={theme}
                />
              </div>
            </div>

            {/* Times Bar */}
            <div className="px-6 flex justify-between items-center opacity-30 mb-8 animate-in fade-in duration-700">
              <div className="flex flex-col items-center">
                <span
                  className="text-[7px] font-black uppercase tracking-widest"
                  style={{ color: '#fff' }}
                >
                  GPS TIME
                </span>
                <span className="text-[9px] font-bold" style={{ color: '#fff' }}>
                  {timeGPS}
                </span>
              </div>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: 'rgba(255,255,255,0.1)' }}
              />
              <div className="flex flex-col items-center">
                <span
                  className="text-[7px] font-black uppercase tracking-widest"
                  style={{ color: '#fff' }}
                >
                  DEVICE TIME
                </span>
                <span className="text-[9px] font-bold" style={{ color: '#fff' }}>
                  {timeGSM}
                </span>
              </div>
              <Divider
                orientation="vertical"
                flexItem
                sx={{ borderColor: 'rgba(255,255,255,0.1)' }}
              />
              <div className="flex flex-col items-center">
                <span
                  className="text-[7px] font-black uppercase tracking-widest"
                  style={{ color: '#fff' }}
                >
                  LAST UPDATE
                </span>
                <span className="text-[9px] font-bold" style={{ color: '#fff' }}>
                  há poucos segundos
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Bottom Actions - Real-time Control */}
      <div className="px-6 py-6 border-t border-white/5 bg-black/40 backdrop-blur-md">
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
              borderColor: 'rgba(239, 68, 68, 0.2)',
              color: '#ef4444',
            }}
          >
            <LockIcon sx={{ mr: 1, fontSize: 18 }} />
            <span className="text-[11px] font-black uppercase tracking-widest">BLOQUEAR</span>
          </Button>
        </div>
        <div className="flex justify-around items-center mt-6 px-4">
          {[
            {
              icon: <GridViewIcon />,
              label: 'Histórico',
              path: `/app/replay?deviceId=${device?.id}`,
            },
            { icon: <EditIcon />, label: 'Editar', path: `/app/settings/device/${device?.id}` },
            {
              icon: <ShareIcon />,
              label: 'Partilhar',
              path: `/app/settings/device/${device?.id}/share`,
            },
            { icon: <PendingIcon />, label: 'Mais', path: '/app/settings/device' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center gap-2 opacity-50 active:opacity-100"
              onClick={() => navigate(item.path)}
            >
              {React.cloneElement(item.icon, { sx: { fontSize: 20, color: '#fff' } })}
              <span
                className="text-[7px] font-black uppercase tracking-widest"
                style={{ color: '#fff' }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default InnovatorHUD;
