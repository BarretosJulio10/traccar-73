import React, { useMemo } from 'react';
import { IconButton, Typography, Tooltip, Box, Button } from '@mui/material';
import { useTranslation } from './LocalizationProvider';
import { useHudTheme } from '../util/ThemeContext';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import InfoIcon from '@mui/icons-material/Info';
import EditIcon from '@mui/icons-material/Edit';
import ShareIcon from '@mui/icons-material/Share';
import GridViewIcon from '@mui/icons-material/GridView';
import PendingIcon from '@mui/icons-material/Pending';
import CloseIcon from '@mui/icons-material/Close';

const ModernGauge = ({ value, max, label, unit, color, trackColor, valueColor, size = 100, strokeWidth = 8, fontSize = 18 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (Math.min(value, max) / max) * circumference;

    return (
        <div className="flex flex-col items-center justify-center relative" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <circle
                    stroke={trackColor}
                    strokeWidth={strokeWidth}
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
                <circle
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={circumference}
                    style={{ strokeDashoffset: offset, transition: 'stroke-dashoffset 1s ease-out' }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx={size / 2}
                    cy={size / 2}
                />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="flex items-baseline">
                    <span className="font-black" style={{ color: valueColor, fontSize }}>{Math.round(value)}</span>
                    {unit && <span className="ml-0.5 opacity-60 font-bold" style={{ color: valueColor, fontSize: fontSize * 0.4 }}>{unit}</span>}
                </div>
                <span className="uppercase tracking-widest font-black opacity-40 -mt-1" style={{ color: valueColor, fontSize: fontSize * 0.35 }}>{label}</span>
            </div>
        </div>
    );
};

const InnovatorHUD = ({ device, position, onClose, onCommand }) => {
    const { t } = useTranslation();
    const { theme } = useHudTheme();
    const muiTheme = useTheme();
    const navigate = useNavigate();

    const speed = useMemo(() => position ? Math.round(position.speed * 1.852) : 0, [position]);
    const battery = useMemo(() => position?.attributes?.batteryLevel || position?.attributes?.battery || 0, [position]);
    const ignition = position?.attributes?.ignition;
    const isOnline = device?.status === 'online';

    const accentColor = theme.accent;
    const secondaryAccent = theme.accentSecondary;
    const bgColor = theme.isDark ? 'rgba(8, 9, 10, 0.92)' : 'rgba(248, 250, 252, 0.95)';

    return (
        <div 
            className="fixed bottom-[1px] left-[1px] right-[1px] overflow-hidden flex flex-col animate-in slide-in-from-bottom duration-500 rounded-t-[32px] border-t border-x shadow-2xl"
            style={{ 
                background: bgColor,
                borderColor: theme.border,
                backdropFilter: 'blur(16px)',
                zIndex: 1000,
                maxHeight: '85vh',
                paddingBottom: 'env(safe-area-inset-bottom, 20px)'
            }}
        >
            {/* Handle/Top Bar */}
            <div className="w-full flex flex-col items-center pt-3 pb-2 relative">
                <div className="w-12 h-1.5 rounded-full mb-4" style={{ background: theme.border }} onClick={onClose} />
                <div className="px-6 w-full flex justify-between items-start">
                    <div className="flex flex-col">
                        <Typography className="text-[18px] font-black uppercase tracking-tight leading-none" style={{ color: theme.textPrimary }}>
                            {device?.name}
                        </Typography>
                        <div className="flex items-center gap-2 mt-1.5">
                           <div 
                                className={`w-2 h-2 rounded-full ${isOnline ? 'animate-pulse' : ''}`} 
                                style={{ 
                                    background: isOnline ? accentColor : theme.textMuted,
                                    boxShadow: isOnline ? `0 0 8px ${accentColor}` : 'none'
                                }}
                            />
                            <Typography className="text-[10px] font-black uppercase tracking-widest" style={{ color: isOnline ? accentColor : theme.textMuted }}>
                                {isOnline ? 'Conectado' : 'Desconectado'}
                            </Typography>
                        </div>
                    </div>
                    <IconButton size="small" onClick={onClose} style={{ color: theme.textSecondary, background: theme.bgSecondary }}>
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </div>
            </div>

            {/* Main Gauges Section */}
            <div className="flex-1 px-4 py-4 flex flex-col items-center justify-center">
                <div className="w-full flex justify-around items-center gap-2">
                    {/* Left Gauge: Battery */}
                    <div className="flex-1 flex justify-center">
                        <ModernGauge 
                            value={battery} 
                            max={100} 
                            label="Bateria" 
                            unit="%" 
                            size={90} 
                            color={battery > 20 ? secondaryAccent : '#ef4444'} 
                            trackColor={theme.bgSecondary}
                            valueColor={theme.textPrimary}
                            fontSize={22}
                        />
                    </div>

                    {/* Center Gauge: Speed */}
                    <div className="flex-[1.5] flex justify-center">
                        <ModernGauge 
                            value={speed} 
                            max={160} 
                            label="Velocidade" 
                            unit="km/h" 
                            size={160} 
                            strokeWidth={12}
                            color={accentColor} 
                            trackColor={theme.bgSecondary}
                            valueColor={theme.textPrimary}
                            fontSize={48}
                        />
                    </div>

                    {/* Right Info: Ignition/Status */}
                    <div className="flex-1 flex flex-col items-center gap-3">
                        <div className="flex flex-col items-center">
                             <div 
                                className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-inner mb-1.5`}
                                style={{ background: theme.bgSecondary, borderColor: theme.border }}
                            >
                                <div 
                                    className={`w-3 h-3 rounded-full ${ignition ? 'animate-pulse' : ''}`}
                                    style={{ 
                                        background: ignition ? accentColor : theme.textMuted,
                                        boxShadow: ignition ? `0 0 10px ${accentColor}` : 'none'
                                    }}
                                />
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-[0.2em]" style={{ color: ignition ? accentColor : theme.textMuted }}>
                                Ignição
                            </span>
                        </div>
                    </div>
                </div>

                {/* Sub-info address bar */}
                <div 
                    className="w-full mt-6 py-3 px-4 rounded-2xl border flex items-center gap-3"
                    style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
                >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: theme.bg, color: accentColor }}>
                        <InfoIcon fontSize="small" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <span className="text-[8px] font-black uppercase tracking-widest opacity-40 block" style={{ color: theme.textPrimary }}>Endereço Atual</span>
                        <Typography className="text-[11px] font-bold truncate" style={{ color: theme.textPrimary }}>
                            {position?.address || 'Localizando endereço...'}
                        </Typography>
                    </div>
                </div>
            </div>

            {/* Action Buttons Sections */}
            <div className="px-6 py-4 flex flex-col gap-4">
                {/* Secondary Actions */}
                <div className="flex justify-between items-center px-2">
                    {[
                        { icon: <EditIcon />, label: 'Editar', path: `/app/settings/device/${device?.id}` },
                        { icon: <GridViewIcon />, label: 'Histórico', path: `/app/replay?deviceId=${device?.id}` },
                        { icon: <ShareIcon />, label: 'Partilhar', path: `/app/settings/device/${device?.id}/share` },
                        { icon: <PendingIcon />, label: 'Mais', action: 'more' }
                    ].map((item, idx) => (
                        <div key={idx} className="flex flex-col items-center gap-1.5" onClick={() => item.path && navigate(item.path)}>
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: theme.bgSecondary, color: theme.textSecondary }}>
                                {item.icon}
                            </div>
                            <span className="text-[8px] font-black uppercase tracking-widest" style={{ color: theme.textSecondary }}>{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Primary Commands (Block/Unblock) */}
                <div className="flex gap-4">
                    <Button 
                        fullWidth
                        variant="contained"
                        onClick={() => onCommand('unblock')}
                        startIcon={<LockOpenIcon />}
                        style={{ 
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.3)',
                            boxShadow: '0 0 15px rgba(16, 185, 129, 0.1)',
                            borderRadius: '16px',
                            fontWeight: 900,
                            padding: '12px',
                            textTransform: 'uppercase',
                            fontSize: '12px'
                        }}
                    >
                        Desbloquear
                    </Button>
                    <Button 
                        fullWidth
                        variant="contained"
                        onClick={() => onCommand('block')}
                        startIcon={<LockIcon />}
                        className="animate-pulse"
                        style={{ 
                            background: 'rgba(239, 68, 68, 0.15)',
                            color: '#ef4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            boxShadow: '0 0 15px rgba(239, 68, 68, 0.1)',
                            borderRadius: '16px',
                            fontWeight: 900,
                            padding: '12px',
                            textTransform: 'uppercase',
                            fontSize: '12px'
                        }}
                    >
                        Bloquear
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default InnovatorHUD;
