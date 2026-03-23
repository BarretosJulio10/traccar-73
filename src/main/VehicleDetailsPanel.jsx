import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
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
import { Tooltip } from '@mui/material';
import { useMediaQuery, useTheme as useMuiTheme } from '@mui/material';

import { useCatch } from '../reactHelper';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { devicesActions } from '../store';
import TacticalGauges from './TacticalGauges';
import { useHudTheme } from '../common/util/ThemeContext';
import useDeviceFullData from './useDeviceFullData';
import { mapIconKey, mapIcons } from '../map/core/preloadImages';

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

    const [isBlocked, setIsBlocked] = useState(device?.attributes?.blocked || false);
    const [isCommandLoading, setIsCommandLoading] = useState(false);
    const [confirmDialog, setConfirmDialog] = useState({ open: false, type: null });

    const sendCommand = useCatch(async (type) => {
        setIsCommandLoading(true);
        setConfirmDialog({ open: false, type: null });
        try {
            const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
            if (!isDemo) {
                await fetchOrThrow('/api/commands/send', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deviceId: device.id, type, attributes: {} }),
                });
            } else {
                await new Promise(r => setTimeout(r, 800));
            }
            setIsBlocked(type === 'engineStop');
            dispatch(devicesActions.update([{ ...device, attributes: { ...device.attributes, blocked: type === 'engineStop' } }]));
        } finally {
            setIsCommandLoading(false);
        }
    });

    if (!device) return null;

    const cardBg = theme.isDark ? '#1a1b1e' : '#f8fafc';
    const dialogBg = theme.isDark ? '#1e1f24' : '#ffffff';
    const iconSrc = mapIcons[mapIconKey(device.category)];
    const ignitionOn = data.ignition;

    const fmt = (val, suffix = '') => (val !== null && val !== undefined && val !== '--') ? `${val}${suffix}` : '--';

    return (
        <div
            className="flex flex-col w-full h-full transition-colors duration-500"
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
                                <button onClick={() => sendCommand(confirmDialog.type)}
                                    className="flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                    style={{ background: cardBg, color: confirmDialog.type === 'engineStop' ? '#ef4444' : theme.accent }}>Confirmar</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Cabeçalho Fixo ── */}
            <div className="flex-shrink-0 px-4 pt-4 pb-2">
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
            </div>

            {/* ── Scroll Area ── */}
            <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pb-4">

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
                            <DataRow label="Bloqueio" value={isBlocked ? 'Bloqueado' : 'Livre'} theme={theme} />
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
                    <DataRow label="Bloqueado" value={isBlocked ? 'Sim' : 'Não'} highlight={isBlocked} theme={theme} />
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

                {/* Endereço movido para o topo */}
            </div>

            {/* ── Botões de Ação Fixos no Rodapé ── */}
            <div className="flex-shrink-0 px-4 pb-4 pt-2 border-t" style={{ borderColor: theme.borderCard }}>
                <div className="flex justify-between items-start w-full">
                    <ActionBtn icon={<MapIcon />} label="Mapa" onClick={onClose} theme={theme} />
                    <ActionBtn
                        icon={isCommandLoading ? <LockOpenIcon className="opacity-50" /> : isBlocked ? <LockOpenIcon /> : <LockIcon />}
                        label={isBlocked ? 'Liberar' : 'Bloquear'}
                        neon={isBlocked}
                        danger={!isBlocked}
                        active={isBlocked}
                        disabled={isCommandLoading}
                        onClick={() => setConfirmDialog({ open: true, type: isBlocked ? 'engineResume' : 'engineStop' })}
                        theme={theme}
                    />
                    <ActionBtn icon={<GpsFixedIcon />} label="Cercas" onClick={() => navigate('/app/geofences')} theme={theme} />
                    <ActionBtn icon={<PlayArrowIcon />} label="Rota"
                        onClick={() => { onClose(); navigate(`/app/reports/route?deviceId=${device.id}`); }}
                        theme={theme} />
                    <ActionBtn icon={<SettingsInputAntennaIcon />} label="Eventos"
                        onClick={() => { onClose(); navigate(`/app/reports/events?deviceId=${device.id}`); }}
                        theme={theme} />
                </div>
            </div>
        </div>
    );
};

export default VehicleDetailsPanel;
