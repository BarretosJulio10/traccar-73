import { demoService } from '../../core/services';
import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useHudTheme } from '../util/ThemeContext';
import { devicesActions } from '../../store';
import useDeviceFullData from '../../main/useDeviceFullData';
import { mapIconKey, mapIcons } from '../../map/core/preloadImages';
import fetchOrThrow from '../util/fetchOrThrow';
import { useCatch } from '../../reactHelper';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import CloseIcon from '@mui/icons-material/Close';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MapIcon from '@mui/icons-material/Map';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import SpeedIcon from '@mui/icons-material/Speed';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import PersonIcon from '@mui/icons-material/Person';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import FingerprintIcon from '@mui/icons-material/Fingerprint';

dayjs.extend(relativeTime);

// ─── Sub-components (mirror VehicleDetailsPanel) ─────────────────────────────

const AlarmBadge = ({ alarm, theme }) => {
  if (!alarm) return null;
  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 border animate-pulse"
      style={{ background: theme.isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.3)' }}
    >
      <WarningAmberIcon sx={{ fontSize: 16, color: '#ef4444' }} />
      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#ef4444' }}>Alarme: {alarm}</span>
    </div>
  );
};

const Section = ({ title, icon, children, theme }) => (
  <div className="mb-3">
    <div className="flex items-center gap-2 mb-2 pb-1 border-b" style={{ borderColor: theme.borderCard }}>
      <div style={{ color: theme.accent }}>{React.cloneElement(icon, { sx: { fontSize: 13 } })}</div>
      <span className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: theme.textMuted }}>{title}</span>
    </div>
    <div className="grid grid-cols-2 gap-2">{children}</div>
  </div>
);

const DataRow = ({ label, value, highlight = false, theme }) => (
  <div
    className="flex flex-col px-2 py-1.5 rounded-lg border"
    style={{ background: theme.isDark ? 'rgba(18,20,24,0.4)' : 'rgba(255,255,255,0.7)', borderColor: theme.borderCard }}
  >
    <span className="text-[8px] font-bold tracking-widest uppercase leading-none" style={{ color: theme.textMuted }}>{label}</span>
    <span className="text-[11px] font-bold mt-0.5 truncate" style={{ color: highlight ? theme.accent : theme.textPrimary }}>
      {value === null || value === undefined || value === '' ? '--' : String(value)}
    </span>
  </div>
);

const ActionBtn = ({ icon, label, onClick, theme, danger = false, active = false, disabled = false }) => {
  const bg = theme.isDark ? '#24262b' : '#ffffff';
  const shadow = theme.isDark
    ? '3px 3px 6px rgba(0,0,0,0.4),-3px -3px 6px rgba(255,255,255,0.02)'
    : '2px 2px 6px rgba(0,0,0,0.12),-2px -2px 6px rgba(255,255,255,0.8)';
  let color = theme.textMuted;
  if (active) color = theme.accent;
  if (danger) color = '#ef4444';
  if (disabled) color = theme.textMuted;

  return (
    <div className="flex flex-col items-center gap-1">
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-11 h-11 rounded-full flex items-center justify-center transition-all duration-300 disabled:opacity-40"
        style={{ background: active ? `${color}1a` : bg, boxShadow: shadow }}
      >
        <div style={{ color }} className="transition-all duration-300">
          {React.cloneElement(icon, { sx: { fontSize: 18 } })}
        </div>
      </button>
      <span className="text-[8px] font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>{label}</span>
    </div>
  );
};

const CircleGauge = ({ value, max, label, unit, color, theme }) => {
  const r = 32;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(value / max, 1)) * circ;
  const track = theme.isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative w-20 h-20 flex items-center justify-center">
        <svg className="absolute w-20 h-20 -rotate-90">
          <circle cx="40" cy="40" r={r} stroke={track} strokeWidth="6" fill="transparent" />
          <circle
            cx="40" cy="40" r={r} stroke={color} strokeWidth="6" fill="transparent"
            strokeDasharray={circ} strokeDashoffset={offset}
            strokeLinecap="round" className="transition-all duration-700"
          />
        </svg>
        <div className="relative flex flex-col items-center">
          <span className="text-[18px] font-black leading-none" style={{ color: theme.textPrimary }}>{value}</span>
          <span className="text-[7px] font-bold uppercase tracking-widest" style={{ color }}>{unit}</span>
        </div>
      </div>
      <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{label}</span>
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────

const InnovatorHUD = ({ device: deviceProp, onClose, onCommand }) => {
  const { theme } = useHudTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const data = useDeviceFullData(deviceProp?.id);
  const device = data.device || deviceProp || {};
  const attrs = data.attributes || {};

  const [isExpanded, setIsExpanded] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [isBlocked, setIsBlocked] = useState(device?.attributes?.blocked ?? false);
  const [isCommandLoading, setIsCommandLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(null); // 'engineStop' | 'engineResume' | null

  useEffect(() => {
    setIsBlocked(device?.attributes?.blocked ?? false);
  }, [device?.attributes?.blocked]);

  const sendCommand = useCatch(async (type) => {
    setIsCommandLoading(true);
    setConfirmOpen(null);
    try {
      const isDemo = demoService.isActive();
      if (!isDemo) {
        await fetchOrThrow('/api/commands/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: device.id, type, attributes: {} }),
        });
      } else {
        await new Promise((r) => setTimeout(r, 800));
      }
      const blocked = type === 'engineStop';
      setIsBlocked(blocked);
      dispatch(devicesActions.update([{ ...device, attributes: { ...device.attributes, blocked } }]));
    } finally {
      setIsCommandLoading(false);
    }
  });

  const onTouchStart = (e) => setTouchStart(e.targetTouches[0].clientY);
  const onTouchEnd = (e) => {
    if (!touchStart) return;
    const dist = touchStart - e.changedTouches[0].clientY;
    if (dist > 50 && !isExpanded) setIsExpanded(true);
    if (dist < -50 && isExpanded) setIsExpanded(false);
    setTouchStart(null);
  };

  const fmt = (val, suffix = '') => (val !== null && val !== undefined && val !== '--') ? `${val}${suffix}` : '--';
  const ignitionOn = data.ignition;
  const iconSrc = mapIcons[mapIconKey(device.category)];
  const cardBg = theme.isDark ? '#1e1f24' : '#f8fafc';

  return (
    <>
      {/* Confirm Dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-[280px] rounded-3xl p-6 border shadow-2xl" style={{ background: cardBg, borderColor: theme.borderCard }}>
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                style={{ background: theme.bgSecondary, color: confirmOpen === 'engineStop' ? '#ef4444' : theme.accent }}>
                {confirmOpen === 'engineStop' ? <LockIcon sx={{ fontSize: 24 }} /> : <LockOpenIcon sx={{ fontSize: 24 }} />}
              </div>
              <h3 className="font-bold text-center text-base mb-2 uppercase tracking-widest" style={{ color: theme.textPrimary }}>
                Confirmação
              </h3>
              <p className="text-[11px] text-center mb-6 font-bold uppercase tracking-tight" style={{ color: theme.textSecondary }}>
                Deseja realmente {confirmOpen === 'engineStop' ? 'BLOQUEAR' : 'LIBERAR'} o veículo?
              </p>
              <div className="flex w-full gap-4">
                <button onClick={() => setConfirmOpen(null)}
                  className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  style={{ background: theme.bgSecondary, color: theme.textMuted }}>
                  Cancelar
                </button>
                <button onClick={() => sendCommand(confirmOpen)}
                  className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                  style={{ background: theme.bgSecondary, color: confirmOpen === 'engineStop' ? '#ef4444' : theme.accent }}>
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet */}
      <div
        className="fixed bottom-0 left-0 right-0 flex flex-col transition-all duration-500 ease-in-out"
        style={{
          zIndex: 200,
          height: isExpanded ? '92vh' : '52vh',
          borderRadius: '28px 28px 0 0',
          background: theme.bgCard,
          borderTop: `1px solid ${theme.borderCard}`,
          boxShadow: theme.isDark ? '0 -20px 60px rgba(0,0,0,0.7)' : '0 -20px 60px rgba(0,0,0,0.12)',
        }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-1 cursor-pointer shrink-0" onClick={() => setIsExpanded(!isExpanded)}>
          <div className="w-12 h-1 rounded-full" style={{ background: theme.isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)' }} />
        </div>

        {/* Header */}
        <div className="shrink-0 px-4 pt-2 pb-2">
          <AlarmBadge alarm={data.alarm} theme={theme} />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              {iconSrc && (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border" style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}>
                  <img src={iconSrc} alt={device.category}
                    className={`w-5 h-5 ${device.status === 'online' ? '' : 'opacity-30 grayscale'}`}
                    style={device.status === 'online' ? { filter: 'saturate(2) hue-rotate(90deg) brightness(1.2)' } : {}} />
                </div>
              )}
              <div className="min-w-0">
                <h2 className="text-[15px] font-black uppercase tracking-widest truncate leading-none" style={{ color: theme.textPrimary }}>
                  {device.name}
                </h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <FingerprintIcon sx={{ fontSize: 9, color: '#3b82f6' }} />
                  <span className="text-[8px] font-bold tracking-widest uppercase truncate" style={{ color: theme.textMuted }}>
                    {device.uniqueId}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border"
                style={{ borderColor: device.status === 'online' ? `${theme.accent}44` : theme.borderCard }}>
                <div className={`w-1.5 h-1.5 rounded-full ${device.status === 'online' ? 'animate-pulse' : ''}`}
                  style={{ background: device.status === 'online' ? theme.accent : theme.textMuted }} />
                <span className="text-[8px] font-black uppercase tracking-widest"
                  style={{ color: device.status === 'online' ? theme.accent : theme.textMuted }}>
                  {device.status === 'online' ? 'Online' : 'Offline'}
                </span>
              </div>
              <button onClick={onClose}
                className="w-7 h-7 rounded-full flex items-center justify-center border transition-all"
                style={{ background: theme.bgSecondary, borderColor: theme.borderCard, color: theme.textMuted }}>
                <CloseIcon sx={{ fontSize: 14 }} />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-4 pb-2" style={{ WebkitOverflowScrolling: 'touch' }}>

          {/* Address */}
          {data.address && (
            <div className="flex items-start gap-3 p-3 rounded-2xl mb-3 border"
              style={{ background: theme.isDark ? 'rgba(255,255,255,0.03)' : '#ffffff', borderColor: theme.borderCard }}>
              <MapIcon sx={{ fontSize: 16, color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <p className="text-[7px] font-bold uppercase tracking-widest mb-0.5" style={{ color: theme.textMuted }}>Localização Atual</p>
                <p className="text-[11px] font-bold leading-snug" style={{ color: theme.textPrimary }}>{data.address}</p>
              </div>
            </div>
          )}

          {/* Gauges Row */}
          <div className="flex items-center justify-around mb-4 py-2">
            <CircleGauge value={data.speedKmh} max={120} label="VELOCIDADE" unit="KM/H" color={theme.accent} theme={theme} />
            <div className="flex flex-col items-center gap-1 px-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border"
                style={{ background: ignitionOn ? `rgba(${theme.accentRgb},0.1)` : theme.bgSecondary, borderColor: ignitionOn ? theme.accent : theme.borderCard }}>
                <div className={`w-2 h-2 rounded-full ${ignitionOn ? 'animate-pulse' : ''}`}
                  style={{ background: ignitionOn ? theme.accent : theme.textMuted }} />
                <span className="text-[9px] font-black uppercase tracking-widest"
                  style={{ color: ignitionOn ? theme.accent : theme.textMuted }}>
                  Motor: {ignitionOn ? 'Ligado' : 'Desligado'}
                </span>
              </div>
              <span className="text-[8px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>
                {data.motion ? '🔵 Movendo' : '⭕ Parado'}
              </span>
            </div>
            <CircleGauge
              value={data.batteryLevel !== null ? Math.round(data.batteryLevel) : 0}
              max={100}
              label="BATERIA"
              unit="%"
              color={data.batteryLevel > 20 ? theme.accent : '#ef4444'}
              theme={theme}
            />
          </div>

          {/* Timestamps */}
          <Section title="Horários" icon={<AccessTimeIcon />} theme={theme}>
            <DataRow label="GPS Fix" value={data.fixTime ? dayjs(data.fixTime).format('DD/MM HH:mm:ss') : '--'} theme={theme} />
            <DataRow label="Servidor" value={data.serverTime ? dayjs(data.serverTime).format('DD/MM HH:mm:ss') : '--'} theme={theme} />
            <DataRow label="Dispositivo" value={data.deviceTime ? dayjs(data.deviceTime).format('DD/MM HH:mm:ss') : '--'} theme={theme} />
            <DataRow label="Última att." value={data.lastUpdate ? dayjs(data.lastUpdate).fromNow() : '--'} theme={theme} />
          </Section>

          {/* GPS & Posição */}
          <Section title="GPS e Posição" icon={<GpsFixedIcon />} theme={theme}>
            <DataRow label="Latitude" value={data.latitude} theme={theme} />
            <DataRow label="Longitude" value={data.longitude} theme={theme} />
            <DataRow label="Altitude" value={fmt(data.altitude, ' m')} theme={theme} />
            <DataRow label="Curso" value={data.position.course !== undefined ? `${Math.round(data.position.course)}° ${data.courseLabel}` : '--'} theme={theme} />
            <DataRow label="Precisão GPS" value={fmt(data.accuracy, ' m')} theme={theme} />
            <DataRow label="Satélites" value={data.satellites} theme={theme} />
            <DataRow label="HDOP" value={data.hdop} theme={theme} />
            <DataRow label="GPS Válido" value={data.valid ? 'Sim' : data.valid === false ? 'Não' : '--'} theme={theme} />
          </Section>

          {/* Velocidade & Movimento */}
          <Section title="Velocidade e Movimento" icon={<SpeedIcon />} theme={theme}>
            <DataRow label="Velocidade" value={fmt(data.speedKmh, ' km/h')} highlight={data.speedKmh > 0} theme={theme} />
            <DataRow label="Em Movimento" value={data.motion ? 'Sim' : 'Não'} highlight={data.motion} theme={theme} />
            <DataRow label="Dist. Total" value={fmt(data.totalDistanceKm, ' km')} theme={theme} />
            <DataRow label="Odômetro" value={fmt(data.odometer, ' km')} theme={theme} />
            {attrs.rpm !== undefined && <DataRow label="RPM" value={data.rpm} theme={theme} />}
          </Section>

          {/* Energia & Elétrico */}
          <Section title="Energia e Elétrico" icon={<ElectricMeterIcon />} theme={theme}>
            <DataRow label="Bateria" value={data.batteryLevel !== null ? `${Math.round(data.batteryLevel)}%` : '--'} theme={theme} />
            <DataRow label="Carregando" value={data.charge ? 'Sim' : 'Não'} highlight={data.charge} theme={theme} />
            <DataRow label="Tensão Ext." value={fmt(data.power, ' V')} theme={theme} />
            <DataRow label="Tensão Bat." value={fmt(data.battery, ' V')} theme={theme} />
            <DataRow label="Ignição" value={ignitionOn ? 'Ligada' : 'Desligada'} highlight={ignitionOn} theme={theme} />
            <DataRow label="Horas Motor" value={fmt(data.engineHours, ' h')} theme={theme} />
          </Section>

          {/* Combustível (condicional) */}
          {(attrs.fuel1 !== undefined || attrs.fuel !== undefined) && (
            <Section title="Combustível" icon={<LocalGasStationIcon />} theme={theme}>
              <DataRow label="Nível 1" value={fmt(data.fuel1, ' L')} theme={theme} />
              {attrs.fuel2 !== undefined && <DataRow label="Nível 2" value={fmt(data.fuel2, ' L')} theme={theme} />}
            </Section>
          )}

          {/* Temperatura (condicional) */}
          {(attrs.temp1 !== undefined || attrs.temperature1 !== undefined) && (
            <Section title="Temperatura" icon={<ThermostatIcon />} theme={theme}>
              <DataRow label="Temp. 1" value={fmt(data.temperature, ' °C')} theme={theme} />
              {attrs.temp2 !== undefined && <DataRow label="Temp. 2" value={fmt(attrs.temp2, ' °C')} theme={theme} />}
              {attrs.temp3 !== undefined && <DataRow label="Temp. 3" value={fmt(attrs.temp3, ' °C')} theme={theme} />}
            </Section>
          )}

          {/* Comunicação */}
          <Section title="Comunicação" icon={<SignalCellularAltIcon />} theme={theme}>
            <DataRow label="Protocolo" value={data.protocol} theme={theme} />
            <DataRow label="Sinal RSSI" value={data.rssi !== '--' ? `${data.rssi} dBm` : '--'} theme={theme} />
            {data.operatorName !== '--' && <DataRow label="Operadora" value={data.operatorName} theme={theme} />}
            {data.signalStrength !== '--' && <DataRow label="Sinal GSM" value={fmt(data.signalStrength, '%')} theme={theme} />}
          </Section>

          {/* Dispositivo */}
          <Section title="Dispositivo" icon={<DirectionsCarIcon />} theme={theme}>
            <DataRow label="IMEI/ID" value={device.uniqueId} theme={theme} />
            <DataRow label="Telefone" value={device.phone || '--'} theme={theme} />
            <DataRow label="Modelo" value={device.model || '--'} theme={theme} />
            <DataRow label="Contato" value={device.contact || '--'} theme={theme} />
            <DataRow label="Categoria" value={device.category || '--'} theme={theme} />
            <DataRow label="Bloqueado" value={isBlocked ? 'Sim' : 'Não'} highlight={isBlocked} theme={theme} />
          </Section>

          {/* Motorista (condicional) */}
          {(data.driverName || data.driverUniqueId) && (
            <Section title="Motorista" icon={<PersonIcon />} theme={theme}>
              {data.driverName && <DataRow label="Nome" value={data.driverName} highlight theme={theme} />}
              {data.driverUniqueId && <DataRow label="ID" value={data.driverUniqueId} theme={theme} />}
            </Section>
          )}

          {/* Bottom padding so content clears the action bar */}
          <div style={{ height: 80 }} />
        </div>

        {/* Fixed Action Bar */}
        <div
          className="shrink-0 px-4 py-3 border-t flex justify-between items-start"
          style={{ borderColor: theme.borderCard, background: theme.bgCard, paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))' }}
        >
          <ActionBtn icon={<MapIcon />} label="Mapa" onClick={onClose} theme={theme} />
          <ActionBtn
            icon={isCommandLoading ? <LockIcon className="opacity-50" /> : isBlocked ? <LockOpenIcon /> : <LockIcon />}
            label={isBlocked ? 'Liberar' : 'Bloquear'}
            active={!isBlocked}
            danger={isBlocked}
            disabled={isCommandLoading}
            onClick={() => setConfirmOpen(isBlocked ? 'engineResume' : 'engineStop')}
            theme={theme}
          />
          <ActionBtn icon={<GpsFixedIcon />} label="Cercas" onClick={() => { onClose(); navigate(`/app/geofence/new?deviceId=${device.id}`); }} theme={theme} />
          <ActionBtn icon={<PlayArrowIcon />} label="Rota"
            onClick={() => { onClose(); navigate(`/app/reports/route?deviceId=${device.id}`); }}
            theme={theme} />
          <ActionBtn icon={<SettingsInputAntennaIcon />} label="Eventos"
            onClick={() => { onClose(); navigate(`/app/reports/events?deviceId=${device.id}`); }}
            theme={theme} />
        </div>
      </div>
    </>
  );
};

export default InnovatorHUD;
