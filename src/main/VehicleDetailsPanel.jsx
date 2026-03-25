import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import MapIcon from '@mui/icons-material/Map';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import GpsFixedIcon from '@mui/icons-material/GpsFixed';
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import SpeedIcon from '@mui/icons-material/Speed';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import NavigationIcon from '@mui/icons-material/Navigation';
import HeightIcon from '@mui/icons-material/Height';
import SatelliteAltIcon from '@mui/icons-material/SatelliteAlt';
import RouterIcon from '@mui/icons-material/Router';
import ElectricMeterIcon from '@mui/icons-material/ElectricMeter';
import LocalGasStationIcon from '@mui/icons-material/LocalGasStation';
import ThermostatIcon from '@mui/icons-material/Thermostat';
import PersonIcon from '@mui/icons-material/Person';
import SignalCellularAltIcon from '@mui/icons-material/SignalCellularAlt';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RouteIcon from '@mui/icons-material/Route';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PauseIcon from '@mui/icons-material/Pause';
import CheckIcon from '@mui/icons-material/Check';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import PolylineIcon from '@mui/icons-material/Polyline';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import { Tooltip, CircularProgress } from '@mui/material';
import { useMediaQuery, useTheme as useMuiTheme } from '@mui/material';

import { useCatch } from '../reactHelper';
import { geofencesActions, errorsActions } from '../store';
import { useDeviceCommands, useRouteReport } from '../core/hooks';
import { createGeofence, linkGeofenceToDevice, updateGeofence, deleteGeofence } from '../features/geofence/geofenceService';
import useGeofence from '../features/geofence/useGeofence';
import GeofenceMap from '../features/geofence/GeofenceMap';
import MapRoutePath from '../map/MapRoutePath';
import MapRoutePoints from '../map/MapRoutePoints';
import MapCamera from '../map/MapCamera';
import RouteReportOverlay from './RouteReportOverlay';
import RoutePlayback from './RoutePlayback';
import TacticalGauges from './TacticalGauges';
import { useHudTheme } from '../common/util/ThemeContext';
import useDeviceFullData from './useDeviceFullData';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';
import { getGeofenceTheme } from '../common/util/geofenceTypes';

// ─── Subcomponentes ──────────────────────────────────────────────────────────

const ActionBtn = ({ icon, label, onClick, theme, neon = false, danger = false, active = false, disabled = false }) => {
    const bg = theme.isDark ? '#24262b' : '#ffffff';
    const shadow = theme.isDark
        ? '3px 3px 6px rgba(0,0,0,0.4),-3px -3px 6px rgba(255,255,255,0.02)'
        : '2px 2px 6px rgba(0,0,0,0.12),-2px -2px 6px rgba(255,255,255,0.8)';
    let color = theme.textMuted;
    if (neon) color = theme.accent;
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
            <span className="text-[8px] font-bold uppercase tracking-widest text-center" style={{ color: theme.textMuted }}>
                {label}
            </span>
        </div>
    );
};

const Section = ({ title, icon, children, theme }) => (
    <div className="mb-3">
        <div className="flex items-center gap-2 mb-2 pb-1 border-b" style={{ borderColor: theme.borderCard }}>
            <div style={{ color: theme.accent }}>{React.cloneElement(icon, { sx: { fontSize: 13 } })}</div>
            <span className="text-[9px] font-bold tracking-[0.2em] uppercase" style={{ color: theme.textMuted }}>{title}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
            {children}
        </div>
    </div>
);

const DataRow = ({ label, value, highlight = false, theme }) => (
    <div className="flex flex-col px-2 py-1.5 rounded-lg border" style={{ background: theme.isDark ? 'rgba(18,20,24,0.4)' : 'rgba(255,255,255,0.7)', borderColor: theme.borderCard }}>
        <span className="text-[8px] font-bold tracking-widest uppercase leading-none" style={{ color: theme.textMuted }}>{label}</span>
        <span className="text-[11px] font-bold mt-0.5 truncate" style={{ color: highlight ? theme.accent : theme.textPrimary }}>
            {value === null || value === undefined || value === '' ? '--' : String(value)}
        </span>
    </div>
);

const AlarmBadge = ({ alarm, theme }) => {
    if (!alarm) return null;
    return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 border border-red-500/30 animate-pulse"
            style={{ background: theme.isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.08)' }}>
            <WarningAmberIcon sx={{ fontSize: 16, color: '#ef4444' }} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Alarme: {alarm}</span>
        </div>
    );
};

// ─── Componente Principal ─────────────────────────────────────────────────────

const VehicleDetailsPanel = ({ deviceId, onClose }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const muiTheme = useMuiTheme();
    const desktop = useMediaQuery(muiTheme.breakpoints.up('md'));
    const { theme } = useHudTheme();

    const data = useDeviceFullData(deviceId);
    const { device, position, attributes } = data;

    // ── Inline geofence creation (hook must be before early return) ────────
    const geo = useGeofence(deviceId);
    const [geoSaving, setGeoSaving] = useState(false);

    // ── Core hooks ────────────────────────────────────────────────────────
    const cmd   = useDeviceCommands(deviceId);
    const route = useRouteReport(deviceId);

    const [showRouteOnMap, setShowRouteOnMap] = useState(false);
    const [showRouteReport, setShowRouteReport] = useState(false);
    const [showPlayback, setShowPlayback] = useState(false);

    const [activeTab, setActiveTab] = useState('dados');
    const handleSetTab = (tab) => {
      if (tab !== 'rota') { route.reset(); setShowRouteOnMap(false); setShowRouteReport(false); setShowPlayback(false); }
      setActiveTab(tab);
    };
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });

    const allGeofences = useSelector((state) => Object.values(state.geofences.items));
    const [editingId, setEditingId] = useState(null);
    const [editingName, setEditingName] = useState('');
    const [confirmDeleteId, setConfirmDeleteId] = useState(null);
    const [geofenceLoading, setGeofenceLoading] = useState(null); // id of geofence being mutated

    const handleGeoEdit = (g) => { setEditingId(g.id); setEditingName(g.name); setConfirmDeleteId(null); };
    const handleGeoEditCancel = () => { setEditingId(null); setEditingName(''); };

    const handleGeoSave = useCatch(async (g) => {
      if (!editingName.trim()) return;
      setGeofenceLoading(g.id);
      try {
        const updated = await updateGeofence({ ...g, name: editingName.trim() });
        dispatch(geofencesActions.update([{ attributes: {}, ...updated }]));
        setEditingId(null);
      } finally { setGeofenceLoading(null); }
    });

    const handleGeoTogglePause = useCatch(async (g) => {
      setGeofenceLoading(g.id);
      const paused = !g.attributes?.disabled;
      try {
        const updated = await updateGeofence({ ...g, attributes: { ...g.attributes, disabled: paused } });
        dispatch(geofencesActions.update([{ attributes: {}, ...updated }]));
      } finally { setGeofenceLoading(null); }
    });

    const handleGeoDelete = useCatch(async (id) => {
      setGeofenceLoading(id);
      try {
        await deleteGeofence(id);
        dispatch(geofencesActions.remove([id]));
        setConfirmDeleteId(null);
      } finally { setGeofenceLoading(null); }
    });


    const handleInlineGeoSave = async () => {
      if (!geo.canSave || !geo.area) return;
      setGeoSaving(true);
      try {
        const geofence = await createGeofence({
          name: geo.name.trim(),
          area: geo.area,
          description: geo.description.trim() || undefined,
        });
        const safe = { attributes: {}, ...geofence };
        await Promise.all(geo.selectedDeviceIds.map((id) => linkGeofenceToDevice(geofence.id, id).catch(() => {})));
        dispatch(geofencesActions.update([safe]));
        // reset for next creation
        geo.resetDrawing();
        geo.setName('');
        geo.setDescription('');
      } catch (err) {
        dispatch(errorsActions.push(err.message));
      } finally {
        setGeoSaving(false);
      }
    };

    const TABS = [
        { key: 'dados', label: 'Dados', Icon: DirectionsCarIcon },
        { key: 'cercas', label: 'Cercas', Icon: GpsFixedIcon },
        { key: 'rota', label: 'Rota', Icon: RouteIcon },
        { key: 'eventos', label: 'Eventos', Icon: WarningAmberIcon },
    ];


    if (!device) return null;

    const cardBg = theme.isDark ? '#1a1b1e' : '#f8fafc';
    const dialogBg = theme.isDark ? '#1e1f24' : '#ffffff';
    const iconSrc = mapIcons[mapIconKey(device.category)];
    const ignitionOn = data.ignition;

    const fmt = (val, suffix = '') => (val !== null && val !== undefined && val !== '--') ? `${val}${suffix}` : '--';

    return (
        <div
            className="flex flex-col w-full h-full transition-colors duration-500 relative overflow-hidden"
            style={{ background: theme.isDark ? theme.bg : theme.bgSecondary }}
        >
            {/* Modal de Confirmação */}
            {confirmDialog.open && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-[280px] rounded-3xl p-6 border shadow-2xl" style={{ background: dialogBg, borderColor: theme.borderCard }}>
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
                                style={{ background: cardBg, color: confirmDialog.type === 'engineStop' ? '#ef4444' : theme.accent }}>
                                {confirmDialog.type === 'engineStop' ? <LockIcon sx={{ fontSize: 24 }} /> : <LockOpenIcon sx={{ fontSize: 24 }} />}
                            </div>
                            <h3 className="font-bold text-center text-base mb-2 uppercase tracking-widest" style={{ color: theme.textPrimary }}>
                                Confirmação
                            </h3>
                            <p className="text-[11px] text-center mb-6 font-bold uppercase tracking-tight" style={{ color: theme.textSecondary }}>
                                Deseja realmente {confirmDialog.type === 'engineStop' ? 'BLOQUEAR' : 'LIBERAR'} o veículo?
                            </p>
                            <div className="flex w-full gap-4">
                                <button onClick={() => setConfirmDialog({ open: false, type: null })}
                                    className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                    style={{ background: cardBg, color: theme.textMuted }}>Cancelar</button>
                                <button onClick={() => { setConfirmDialog({ open: false, type: null }); if (confirmDialog.type === 'engineStop') cmd.lock(); else cmd.unlock(); }}
                                    className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                    style={{ background: cardBg, color: confirmDialog.type === 'engineStop' ? '#ef4444' : theme.accent }}>Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Cabeçalho Fixo ── */}
            <div className="flex-shrink-0 px-4 pt-[10px] pb-2">
                {/* Alarme ativo */}
                <AlarmBadge alarm={data.alarm} theme={theme} />

                {/* Linha do nome */}
                <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 min-w-0">
                        {iconSrc && (
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                style={{ background: cardBg }}>
                                <img src={iconSrc} alt={device.category}
                                    className={`w-5 h-5 ${data.device.status === 'online' ? '' : 'opacity-30 grayscale'}`}
                                    style={data.device.status === 'online' ? { filter: 'saturate(2) hue-rotate(90deg) brightness(1.2)' } : {}} />
                            </div>
                        )}
                        <div className="min-w-0">
                            <h2 className="text-[16px] font-black uppercase tracking-widest truncate leading-none" style={{ color: theme.textPrimary }}>
                                {device.name}
                            </h2>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <FingerprintIcon sx={{ fontSize: 9, color: '#3b82f6' }} />
                                <span className="text-[8px] font-bold tracking-widest uppercase" style={{ color: theme.textMuted }}>
                                    {device.uniqueId}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        {/* Status badge */}
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border"
                            style={{ borderColor: data.device.status === 'online' ? `${theme.accent}44` : theme.borderCard }}>
                            <div className={`w-1.5 h-1.5 rounded-full ${data.device.status === 'online' ? 'animate-pulse' : ''}`}
                                style={{ background: data.device.status === 'online' ? theme.accent : theme.textMuted }} />
                            <span className="text-[8px] font-black uppercase tracking-widest"
                                style={{ color: data.device.status === 'online' ? theme.accent : theme.textMuted }}>
                                {data.device.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                        </div>
                        {/* Botão fechar */}
                        <Tooltip title="Fechar painel" placement="left" arrow>
                            <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center border transition-all"
                                style={{ background: cardBg, borderColor: theme.borderCard, color: theme.textMuted }}>
                                <CloseIcon sx={{ fontSize: 14 }} />
                            </button>
                        </Tooltip>
                    </div>
                </div>

                {/* Gauges apenas no PC */}
                {desktop && (
                    <div className="mb-3">
                        <TacticalGauges
                            speed={data.speedKmh}
                            battery={data.batteryLevel || 0}
                            ignition={ignitionOn ? 'ON' : 'OFF'}
                            address={data.address || null}
                            fixTime={data.fixTime ? dayjs(data.fixTime).format('DD/MM HH:mm:ss') : null}
                            serverTime={data.serverTime ? dayjs(data.serverTime).format('DD/MM HH:mm:ss') : null}
                            deviceTime={data.deviceTime ? dayjs(data.deviceTime).format('DD/MM HH:mm:ss') : null}
                            lastUpdate={data.lastUpdate ? dayjs(data.lastUpdate).fromNow() : null}
                        />
                    </div>
                )}

                {/* ── Tab Bar ── */}
                <div className="flex items-center gap-2 mt-1">
                    {/* Pills */}
                    <div
                        className="flex flex-1 p-1 rounded-2xl gap-0.5"
                        style={{ background: theme.bgCard, border: `1px solid ${theme.borderCard}` }}
                    >
                        {TABS.map(({ key, label, Icon }) => (
                            <button
                                key={key}
                                type="button"
                                onClick={() => handleSetTab(key)}
                                className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all active:scale-95"
                                style={{
                                    background: activeTab === key
                                        ? theme.isDark ? 'rgba(255,255,255,0.10)' : '#1e2952'
                                        : 'transparent',
                                    color: activeTab === key
                                        ? theme.isDark ? theme.textPrimary : '#ffffff'
                                        : theme.textMuted,
                                    boxShadow: activeTab === key ? '0 2px 8px rgba(0,0,0,0.18)' : 'none',
                                }}
                            >
                                <Icon sx={{ fontSize: 11 }} />
                                {label}
                            </button>
                        ))}
                    </div>
                    {/* Lock pill */}
                    <Tooltip title={cmd.isBlocked ? 'Liberar veículo' : 'Bloquear veículo'} placement="left" arrow>
                        <button
                            type="button"
                            onClick={() => setConfirmDialog({ open: true, type: cmd.isBlocked ? 'engineResume' : 'engineStop' })}
                            disabled={cmd.isPending}
                            className="w-10 h-10 rounded-2xl flex items-center justify-center border transition-all active:scale-95 disabled:opacity-40 flex-shrink-0"
                            style={{
                                background: cmd.isBlocked ? 'rgba(239,68,68,0.12)' : theme.bgCard,
                                borderColor: cmd.isBlocked ? 'rgba(239,68,68,0.4)' : theme.borderCard,
                                color: cmd.isBlocked ? '#ef4444' : theme.textMuted,
                            }}
                        >
                            {cmd.isPending
                                ? <RefreshIcon sx={{ fontSize: 15, opacity: 0.5 }} className="animate-spin" />
                                : cmd.isBlocked
                                    ? <LockIcon sx={{ fontSize: 15 }} />
                                    : <LockOpenIcon sx={{ fontSize: 15 }} />}
                        </button>
                    </Tooltip>
                </div>
            </div>

            {/* ── Scroll Area ── */}
            <div className="grow-0 shrink min-h-0 overflow-y-auto scrollbar-hide px-4 pb-6">

              {/* ══ TAB: DADOS ══ */}
              {activeTab === 'dados' && (<>

                {/* Mobile: Anel de Velocidade */}
                {!desktop && (
                    <div className="flex items-center gap-3 mb-4">
                        <div className="relative flex justify-center items-center flex-shrink-0 w-[100px] h-[100px]">
                            <div className="absolute w-[100px] h-[100px] rounded-full" style={{ background: theme.isDark ? '#24262b' : '#f0f4f8' }} />
                            <svg className="absolute w-[100px] h-[100px] transform -rotate-90 pointer-events-none">
                                <circle cx="50" cy="50" r="42" stroke={theme.isDark ? '#24262b' : '#e2e8f0'} strokeWidth="7" fill="transparent" />
                                <circle cx="50" cy="50" r="42" stroke={theme.accent} strokeWidth="7" fill="transparent"
                                    strokeLinecap="round" strokeDasharray={2 * Math.PI * 42}
                                    strokeDashoffset={2 * Math.PI * 42 - (Math.min(data.speedKmh / 120, 1)) * 2 * Math.PI * 42}
                                    className="transition-all duration-1000 ease-out" />
                            </svg>
                            <div className="relative z-10 flex flex-col items-center justify-center">
                                <span className="text-[6px] font-bold tracking-widest uppercase" style={{ color: theme.textMuted }}>Veloc.</span>
                                <span className="text-[22px] font-black leading-none" style={{ color: theme.textPrimary }}>{data.speedKmh}</span>
                                <span className="text-[6px] font-bold tracking-widest" style={{ color: theme.accent }}>KM/H</span>
                            </div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-1.5">
                            <DataRow label="Ignição" value={ignitionOn ? 'Ligada' : 'Desligada'} highlight={ignitionOn} theme={theme} />
                            <DataRow label="Bateria" value={data.batteryLevel !== null ? `${Math.round(data.batteryLevel)}%` : '--'} theme={theme} />
                            <DataRow label="Movimento" value={data.motion ? 'Sim' : 'Não'} highlight={data.motion} theme={theme} />
                            <DataRow label="Bloqueio" value={cmd.isBlocked ? 'Bloqueado' : 'Livre'} theme={theme} />
                        </div>
                    </div>
                )}

                {/* Endereço (apenas mobile — no desktop fica dentro do TacticalGauges) */}
                {!desktop && data.address && (
                    <div className="flex items-start gap-3 p-3 rounded-2xl mb-3 border"
                        style={{ background: theme.isDark ? '#24262b' : '#ffffff', borderColor: theme.borderCard }}>
                        <MapIcon sx={{ fontSize: 18, color: '#3b82f6', flexShrink: 0, marginTop: '2px' }} />
                        <div>
                            <p className="text-[8px] font-bold uppercase tracking-widest leading-none mb-1" style={{ color: theme.textMuted }}>
                                Localização Atual
                            </p>
                            <p className="text-[11px] font-bold leading-snug" style={{ color: theme.textPrimary }}>
                                {data.address}
                            </p>
                        </div>
                    </div>
                )}

                {/* SEÇÃO: GPS & Posição */}
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

                {/* SEÇÃO: Velocidade & Movimento */}
                <Section title="Velocidade e Movimento" icon={<SpeedIcon />} theme={theme}>
                    <DataRow label="Velocidade" value={fmt(data.speedKmh, ' km/h')} highlight={data.speedKmh > 0} theme={theme} />
                    <DataRow label="Em Movimento" value={data.motion ? 'Sim' : 'Não'} highlight={data.motion} theme={theme} />
                    <DataRow label="Dist. Total" value={fmt(data.totalDistanceKm, ' km')} theme={theme} />
                    <DataRow label="Odômetro" value={fmt(data.odometer, ' km')} theme={theme} />
                    {data.attributes.rpm !== undefined && (
                        <DataRow label="RPM" value={data.rpm} theme={theme} />
                    )}
                </Section>

                {/* SEÇÃO: Energia & Elétrico */}
                <Section title="Energia e Elétrico" icon={<ElectricMeterIcon />} theme={theme}>
                    <DataRow label="Bateria" value={data.batteryLevel !== null ? `${Math.round(data.batteryLevel)}%` : '--'} theme={theme} />
                    <DataRow label="Carregando" value={data.charge ? 'Sim' : 'Não'} highlight={data.charge} theme={theme} />
                    <DataRow label="Tensão Ext." value={fmt(data.power, ' V')} theme={theme} />
                    <DataRow label="Tensão Bat." value={fmt(data.battery, ' V')} theme={theme} />
                    <DataRow label="Ignição" value={ignitionOn ? 'Ligada' : 'Desligada'} highlight={ignitionOn} theme={theme} />
                    <DataRow label="Horas Motor" value={fmt(data.engineHours, ' h')} theme={theme} />
                </Section>

                {/* SEÇÃO: Combustível (se disponível) */}
                {(attributes.fuel1 !== undefined || attributes.fuel !== undefined) && (
                    <Section title="Combustível" icon={<LocalGasStationIcon />} theme={theme}>
                        <DataRow label="Nível 1" value={fmt(data.fuel1, ' L')} theme={theme} />
                        {attributes.fuel2 !== undefined && <DataRow label="Nível 2" value={fmt(data.fuel2, ' L')} theme={theme} />}
                    </Section>
                )}

                {/* SEÇÃO: Temperatura (se disponível) */}
                {(attributes.temp1 !== undefined || attributes.temperature1 !== undefined) && (
                    <Section title="Temperatura" icon={<ThermostatIcon />} theme={theme}>
                        <DataRow label="Temp. 1" value={fmt(data.temperature, ' °C')} theme={theme} />
                        {attributes.temp2 !== undefined && <DataRow label="Temp. 2" value={fmt(attributes.temp2, ' °C')} theme={theme} />}
                        {attributes.temp3 !== undefined && <DataRow label="Temp. 3" value={fmt(attributes.temp3, ' °C')} theme={theme} />}
                    </Section>
                )}

                {/* SEÇÃO: Comunicação */}
                <Section title="Comunicação" icon={<SignalCellularAltIcon />} theme={theme}>
                    <DataRow label="Protocolo" value={data.protocol} theme={theme} />
                    <DataRow label="Sinal RSSI" value={data.rssi !== '--' ? `${data.rssi} dBm` : '--'} theme={theme} />
                    {data.operatorName !== '--' && <DataRow label="Operadora" value={data.operatorName} theme={theme} />}
                    {data.signalStrength !== '--' && <DataRow label="Sinal GSM" value={fmt(data.signalStrength, '%')} theme={theme} />}
                </Section>

                {/* SEÇÃO: Dispositivo */}
                <Section title="Dispositivo" icon={<DirectionsCarIcon />} theme={theme}>
                    <DataRow label="IMEI/ID" value={device.uniqueId} theme={theme} />
                    <DataRow label="Telefone" value={device.phone || '--'} theme={theme} />
                    <DataRow label="Modelo" value={device.model || '--'} theme={theme} />
                    <DataRow label="Contato" value={device.contact || '--'} theme={theme} />
                    <DataRow label="Categoria" value={device.category || '--'} theme={theme} />
                    <DataRow label="Bloqueado" value={cmd.isBlocked ? 'Sim' : 'Não'} highlight={cmd.isBlocked} theme={theme} />
                </Section>

                {/* SEÇÃO: Motorista (se disponível) */}
                {(data.driverName || data.driverUniqueId) && (
                    <Section title="Motorista" icon={<PersonIcon />} theme={theme}>
                        {data.driverName && <DataRow label="Nome" value={data.driverName} highlight theme={theme} />}
                        {data.driverUniqueId && <DataRow label="ID" value={data.driverUniqueId} theme={theme} />}
                    </Section>
                )}

                {/* SEÇÃO: Horários (visível apenas no Mobile, pois no Desktop já está no TacticalGauges) */}
                {!desktop && (
                    <Section title="Horários" icon={<AccessTimeIcon />} theme={theme}>
                        <DataRow label="GPS Fix" value={data.fixTime ? dayjs(data.fixTime).format('DD/MM HH:mm:ss') : '--'} theme={theme} />
                        <DataRow label="Servidor" value={data.serverTime ? dayjs(data.serverTime).format('DD/MM HH:mm:ss') : '--'} theme={theme} />
                        <DataRow label="Dispositivo" value={data.deviceTime ? dayjs(data.deviceTime).format('DD/MM HH:mm:ss') : '--'} theme={theme} />
                        <DataRow label="Última att." value={data.lastUpdate ? dayjs(data.lastUpdate).fromNow() : '--'} theme={theme} />
                    </Section>
                )}

              </>)}

              {/* ══ TAB: CERCAS ══ */}
              {activeTab === 'cercas' && (
                <div className="flex flex-col gap-3 pt-1">

                  {/* Map drawing layer */}
                  <GeofenceMap
                    mode={geo.mode} circleStep={geo.circleStep} circleCenter={geo.circleCenter}
                    circleRadius={geo.circleRadius} circleRadiusPreview={geo.circleRadiusPreview}
                    polyStep={geo.polyStep} polyPoints={geo.polyPoints} previewPoint={geo.previewPoint}
                    onMapClick={geo.handleMapClick} onMouseMove={geo.handleMouseMove}
                    onClosePolygon={geo.closePolygon}
                  />

                  {/* ── NOVA CERCA ────────────────────────────────────── */}
                  <p className="text-[10px] font-black uppercase tracking-wider" style={{ color: theme.textMuted }}>Nova Cerca</p>

                  {/* Type icon buttons — click = select + start drawing */}
                  <div className="flex gap-2">
                    {[
                      { key: 'circle', label: 'Circular', Icon: RadioButtonUncheckedIcon },
                      { key: 'polygon', label: 'Polígono', Icon: PolylineIcon },
                    ].map(({ key, label, Icon }) => {
                      const active = geo.mode === key && (geo.circleStep !== 'idle' || geo.polyStep !== 'idle' || geo.isDrawingDone);
                      return (
                        <button key={key} type="button" onClick={() => geo.startModeDrawing(key)}
                          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border transition-all active:scale-95"
                          style={{ background: active ? `${theme.accent}15` : theme.bgCard, borderColor: active ? theme.accent : theme.borderCard }}>
                          <Icon sx={{ fontSize: 18, color: active ? theme.accent : theme.textMuted }} />
                          <span className="text-xs font-bold" style={{ color: active ? theme.accent : theme.textSecondary }}>{label}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Instruction + Refazer (only while drawing or done) */}
                  {(geo.circleStep !== 'idle' || geo.polyStep !== 'idle') && (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-start gap-2 px-3 py-2.5 rounded-2xl border"
                        style={{ background: geo.isDrawingDone ? `${theme.accent}08` : `${theme.accent}06`, borderColor: geo.isDrawingDone ? `${theme.accent}40` : `${theme.accent}20` }}>
                        <TouchAppIcon sx={{ fontSize: 13, color: theme.accent, flexShrink: 0, mt: '1px' }} />
                        <p className="text-[11px] leading-relaxed" style={{ color: theme.textSecondary }}>
                          {geo.mode === 'circle'
                            ? ({ center: 'Clique no mapa para definir o centro', radius: 'Clique novamente para definir o raio', done: 'Ajuste o raio se desejar' }[geo.circleStep] ?? '')
                            : (geo.polyStep === 'drawing'
                              ? `${geo.polyPoints.length} pt${geo.polyPoints.length !== 1 ? 's' : ''} — ${geo.polyPoints.length >= 3 ? 'duplo clique para fechar' : 'continue clicando'}`
                              : 'Polígono definido')}
                        </p>
                      </div>
                      <button type="button" onClick={geo.resetDrawing}
                        className="w-9 h-9 rounded-xl border flex items-center justify-center flex-shrink-0 active:scale-90 transition-all"
                        style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: '#ef4444' }}>
                        <RefreshIcon sx={{ fontSize: 14 }} />
                      </button>
                    </div>
                  )}

                  {/* Radius slider (circle, center placed) */}
                  {geo.mode === 'circle' && geo.circleCenter && (
                    <div className="flex items-center gap-3">
                      <input type="range" min={50} max={50000} step={50} value={geo.circleRadius}
                        onChange={(e) => geo.handleSetRadius(e.target.value)}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer" style={{ accentColor: theme.accent }} />
                      <span className="text-xs font-black tabular-nums w-16 text-right flex-shrink-0" style={{ color: theme.accent }}>
                        {geo.circleRadius >= 1000 ? `${(geo.circleRadius / 1000).toFixed(1)} km` : `${geo.circleRadius} m`}
                      </span>
                    </div>
                  )}

                  {/* Name + Description + Save (after drawing done) */}
                  {geo.isDrawingDone && (
                    <>
                      <input autoFocus value={geo.name} onChange={(e) => geo.setName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && geo.canSave && handleInlineGeoSave()}
                        placeholder="Nome da cerca *"
                        className="w-full px-4 py-3 rounded-2xl border text-sm font-semibold outline-none transition-all"
                        style={{ background: theme.bgCard, borderColor: geo.name.trim() ? theme.accent : theme.borderCard, color: theme.textPrimary }} />
                      <input value={geo.description} onChange={(e) => geo.setDescription(e.target.value)}
                        placeholder="Descrição (opcional)"
                        className="w-full px-4 py-2.5 rounded-2xl border text-sm outline-none"
                        style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textPrimary }} />
                      <button type="button" onClick={handleInlineGeoSave} disabled={!geo.canSave || geoSaving}
                        className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                        style={{ background: geo.canSave && !geoSaving ? theme.accent : theme.bgSecondary, color: geo.canSave && !geoSaving ? '#fff' : theme.textMuted, boxShadow: geo.canSave && !geoSaving ? `0 6px 20px ${theme.accent}55` : 'none' }}>
                        {geoSaving ? <CircularProgress size={14} color="inherit" /> : <CheckIcon sx={{ fontSize: 15 }} />}
                        {geoSaving ? 'Salvando…' : 'Salvar Cerca'}
                      </button>
                    </>
                  )}

                  {/* ── CERCAS CRIADAS ─────────────────────────────────── */}
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex-1 h-px" style={{ background: theme.border }} />
                    <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: theme.textMuted }}>Cercas Criadas</span>
                    <div className="flex-1 h-px" style={{ background: theme.border }} />
                  </div>

                  {allGeofences.length === 0 && (
                    <p className="text-xs py-2 text-center" style={{ color: theme.textMuted }}>Nenhuma cerca criada ainda</p>
                  )}
                  {allGeofences.map((g) => {
                    const isCircle = typeof g.area === 'string' && g.area.startsWith('CIRCLE');
                    const isPaused = !!g.attributes?.disabled;
                    const { icon: IconComponent, color } = getGeofenceTheme(g.attributes?.type || 'custom');
                    const isLoading = geofenceLoading === g.id;
                    const isEditing = editingId === g.id;
                    const isConfirmingDelete = confirmDeleteId === g.id;
                    return (
                      <div key={g.id} className="rounded-2xl border overflow-hidden transition-all"
                        style={{ background: theme.bgCard, borderColor: isConfirmingDelete ? 'rgba(239,68,68,0.4)' : theme.borderCard, opacity: isPaused ? 0.6 : 1 }}>
                        <div className="flex items-center gap-2.5 px-3 py-2.5">
                          <span className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}18` }}>
                            <IconComponent sx={{ fontSize: 14, color: isPaused ? theme.textMuted : color }} />
                          </span>
                          {isEditing ? (
                            <input autoFocus value={editingName} onChange={(e) => setEditingName(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleGeoSave(g); if (e.key === 'Escape') handleGeoEditCancel(); }}
                              className="flex-1 min-w-0 px-2 py-1 rounded-lg border text-xs font-semibold outline-none"
                              style={{ background: theme.bg, borderColor: theme.accent, color: theme.textPrimary }} />
                          ) : (
                            <span className="flex-1 min-w-0 text-xs font-semibold truncate" style={{ color: isPaused ? theme.textMuted : theme.textPrimary }}>{g.name}</span>
                          )}
                          {!isEditing && (
                            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-lg flex-shrink-0"
                              style={{ background: `${theme.accent}15`, color: theme.accent }}>{isCircle ? 'Circ.' : 'Poli.'}</span>
                          )}
                          {isLoading ? (
                            <RefreshIcon sx={{ fontSize: 14, color: theme.textMuted }} className="animate-spin flex-shrink-0" />
                          ) : isEditing ? (
                            <div className="flex gap-1 flex-shrink-0">
                              <button type="button" onClick={() => handleGeoSave(g)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90" style={{ background: `${theme.accent}20`, color: theme.accent }}><CheckIcon sx={{ fontSize: 13 }} /></button>
                              <button type="button" onClick={handleGeoEditCancel} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}><CloseIcon sx={{ fontSize: 13 }} /></button>
                            </div>
                          ) : (
                            <div className="flex gap-1 flex-shrink-0">
                              <button type="button" onClick={() => handleGeoEdit(g)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90" style={{ background: theme.bgSecondary, color: theme.textMuted }}><EditIcon sx={{ fontSize: 12 }} /></button>
                              <button type="button" onClick={() => handleGeoTogglePause(g)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90" style={{ background: isPaused ? `${theme.accent}20` : theme.bgSecondary, color: isPaused ? theme.accent : theme.textMuted }}>{isPaused ? <PlayArrowIcon sx={{ fontSize: 12 }} /> : <PauseIcon sx={{ fontSize: 12 }} />}</button>
                              <button type="button" onClick={() => setConfirmDeleteId(isConfirmingDelete ? null : g.id)} className="w-7 h-7 rounded-lg flex items-center justify-center active:scale-90" style={{ background: isConfirmingDelete ? 'rgba(239,68,68,0.15)' : theme.bgSecondary, color: '#ef4444' }}><DeleteIcon sx={{ fontSize: 12 }} /></button>
                            </div>
                          )}
                        </div>
                        {isConfirmingDelete && (
                          <div className="flex items-center justify-between px-3 py-2 border-t" style={{ borderColor: 'rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.06)' }}>
                            <span className="text-[10px] font-bold" style={{ color: '#ef4444' }}>Apagar esta cerca?</span>
                            <div className="flex gap-2">
                              <button type="button" onClick={() => setConfirmDeleteId(null)} className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider" style={{ background: theme.bgSecondary, color: theme.textMuted }}>Não</button>
                              <button type="button" onClick={() => handleGeoDelete(g.id)} className="px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Apagar</button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ══ TAB: ROTA ══ */}
              {activeTab === 'rota' && (
                <>
                  {/* Route map layers — only when not in playback mode (playback owns its own layers) */}
                  {route.items.length > 0 && showRouteOnMap && !showPlayback && (
                    <>
                      <MapRoutePath positions={route.items} />
                      <MapRoutePoints positions={route.items} onClick={(id) => route.selectItem(route.items.find((it) => it.id === id))} />
                      <MapCamera positions={route.items} />
                    </>
                  )}
                  {route.selectedItem && !showRouteOnMap && !showPlayback && (
                    <MapCamera positions={[route.selectedItem]} />
                  )}

                  <div className="flex flex-col gap-3 pt-1">
                    {/* Period + Mostrar */}
                    <div className="flex gap-2 items-center">
                      <select
                        value={route.period}
                        onChange={(e) => route.setPeriod(e.target.value)}
                        className="flex-1 px-3 py-2.5 rounded-2xl border text-xs font-bold outline-none appearance-none"
                        style={{ background: theme.bgCard, borderColor: theme.borderCard, color: theme.textPrimary }}
                      >
                        <option value="today">Hoje</option>
                        <option value="yesterday">Ontem</option>
                        <option value="thisWeek">Esta Semana</option>
                        <option value="thisMonth">Este Mês</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => route.fetch()}
                        disabled={route.loading}
                        className="h-10 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center gap-2 flex-shrink-0 active:scale-95 transition-all disabled:opacity-50"
                        style={{ background: theme.accent, color: '#fff', boxShadow: `0 4px 14px ${theme.accent}44` }}
                      >
                        {route.loading
                          ? <CircularProgress size={12} color="inherit" />
                          : <RouteIcon sx={{ fontSize: 14 }} />}
                        Mostrar
                      </button>
                    </div>

                    {/* Empty state */}
                    {!route.loading && route.items.length === 0 && (
                      <p className="text-xs py-4 text-center" style={{ color: theme.textMuted }}>
                        Selecione o período e toque em Mostrar
                      </p>
                    )}

                    {/* Results list */}
                    {!route.loading && route.items.length > 0 && (
                      <>
                        {/* Header: count + map toggle + relatório */}
                        <div className="flex items-center gap-2">
                          <p className="text-[9px] font-black uppercase tracking-widest flex-1" style={{ color: theme.textMuted }}>
                            {route.items.length} Registros
                          </p>
                          <button
                            type="button"
                            onClick={() => setShowRouteOnMap((v) => !v)}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all flex-shrink-0"
                            style={{
                              background: showRouteOnMap ? `${theme.accent}18` : theme.bgCard,
                              borderColor: showRouteOnMap ? theme.accent : theme.borderCard,
                              color: showRouteOnMap ? theme.accent : theme.textMuted,
                            }}
                          >
                            <RouteIcon sx={{ fontSize: 11 }} />
                            {showRouteOnMap ? 'Ocultar' : 'Mapa'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowRouteReport(true); setShowPlayback(false); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all flex-shrink-0"
                            style={{
                              background: `${theme.accent}18`,
                              borderColor: theme.accent,
                              color: theme.accent,
                            }}
                          >
                            <RouteIcon sx={{ fontSize: 11 }} />
                            Relatório
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowPlayback(true); setShowRouteReport(false); setShowRouteOnMap(false); }}
                            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all flex-shrink-0"
                            style={{
                              background: showPlayback ? 'rgba(34,197,94,0.18)' : theme.bgCard,
                              borderColor: showPlayback ? '#22c55e' : theme.borderCard,
                              color: showPlayback ? '#22c55e' : theme.textMuted,
                            }}
                          >
                            <PlayArrowIcon sx={{ fontSize: 11 }} />
                            Play
                          </button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {route.items.map((item) => {
                            const isSelected = route.selectedItem?.id === item.id;
                            const speed = Math.round(item.speed * 1.852);
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => route.selectItem(item)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-2xl border text-left transition-all active:scale-[0.98]"
                                style={{
                                  background: isSelected ? `${theme.accent}12` : theme.bgCard,
                                  borderColor: isSelected ? `${theme.accent}40` : theme.borderCard,
                                }}
                              >
                                <div className="flex flex-col items-center flex-shrink-0 w-12">
                                  <span className="text-[11px] font-black tabular-nums leading-tight" style={{ color: theme.accent }}>
                                    {dayjs(item.fixTime).format('HH:mm')}
                                  </span>
                                  <span className="text-[9px] font-bold tabular-nums" style={{ color: speed > 0 ? theme.textSecondary : theme.textMuted }}>
                                    {speed} km/h
                                  </span>
                                </div>
                                <span className="flex-1 min-w-0 text-[10px] leading-snug" style={{ color: isSelected ? theme.textPrimary : theme.textSecondary }}>
                                  {item.address || `${item.latitude?.toFixed(4)}, ${item.longitude?.toFixed(4)}`}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* ══ TAB: EVENTOS ══ */}
              {activeTab === 'eventos' && (
                <div className="flex flex-col gap-3 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-center py-4" style={{ color: theme.textMuted }}>
                    Histórico de Eventos
                  </p>
                  <button
                    type="button"
                    onClick={() => { onClose(); navigate(`/app/reports/events?deviceId=${device.id}`); }}
                    className="w-full h-11 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                    style={{ background: theme.accent, color: '#fff', boxShadow: `0 4px 16px ${theme.accent}44` }}
                  >
                    <WarningAmberIcon sx={{ fontSize: 15 }} />
                    Ver Relatório de Eventos
                  </button>
                </div>
              )}

            </div>

            {/* ── Full-screen route report overlay ── */}
            {showRouteReport && route.items.length > 0 && (
              <RouteReportOverlay
                device={device}
                routeItems={route.items}
                onClose={() => setShowRouteReport(false)}
              />
            )}
            {/* ── Route playback ── */}
            {showPlayback && route.items.length > 0 && (
              <RoutePlayback
                device={device}
                routeItems={route.items}
                onClose={() => setShowPlayback(false)}
              />
            )}
        </div>
    );
};

export default VehicleDetailsPanel;
