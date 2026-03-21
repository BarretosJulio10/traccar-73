import React from 'react';
import { useHudTheme } from '../common/util/ThemeContext';

// Relógio circular individual
const Gauge = ({ value, max, label, unit, color, trackColor, valueColor, size = 110 }) => {
    const radius = size * 0.4;
    const stroke = size * 0.065;
    const normalizedRadius = radius - stroke * 2;
    const circumference = normalizedRadius * 2 * Math.PI;
    const strokeDashoffset = circumference - (Math.min(value, max) / max) * circumference;

    return (
        <div className="flex flex-col items-center gap-1.5">
            {/* Anel Circular */}
            <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
                <svg height={size} width={size} className="absolute transform -rotate-90">
                    <circle stroke={trackColor} fill="transparent" strokeWidth={stroke} r={normalizedRadius} cx={size / 2} cy={size / 2} />
                    <circle
                        stroke={color}
                        fill="transparent"
                        strokeDasharray={circumference + ' ' + circumference}
                        style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.8s ease' }}
                        strokeWidth={stroke}
                        strokeLinecap="round"
                        r={normalizedRadius}
                        cx={size / 2}
                        cy={size / 2}
                    />
                </svg>
                {/* Valor no centro */}
                <div className="relative z-10 flex items-baseline justify-center gap-0.5">
                    <span className="text-[20px] font-black leading-none" style={{ color: valueColor }}>
                        {Math.round(value)}
                    </span>
                    {unit && (
                        <span className="text-[8px] font-black tracking-tight uppercase" style={{ color }}>
                            {unit}
                        </span>
                    )}
                </div>
            </div>
            {/* Label ABAIXO do relógio */}
            <span
                className="text-[9px] font-black tracking-[0.15em] uppercase text-center"
                style={{ color }}
            >
                {label}
            </span>
        </div>
    );
};

// Componente principal dos relógios táticos
const TacticalGauges = ({ speed, battery, ignition }) => {
    const { theme } = useHudTheme();
    const trackColor = theme.isDark ? '#1a1c21' : '#e2e8f0';
    const batteryColor = battery < 20 ? '#ef4444' : theme.accentSecondary;
    const ignitionOn = ignition === 'ON';

    return (
        <div
            className="flex flex-col gap-3 w-full rounded-2xl p-4 transition-colors duration-500"
            style={{
                background: theme.isDark ? 'rgba(18,20,24,0.65)' : 'rgba(230,236,243,0.85)',
                border: `1px solid ${theme.border}`,
            }}
        >
            {/* Linha dos relógios */}
            <div className="flex items-start justify-around gap-4 w-full">
                <Gauge
                    value={speed}
                    max={160}
                    label="Velocidade"
                    unit="km/h"
                    color={theme.accent}
                    trackColor={trackColor}
                    valueColor={theme.textPrimary}
                    size={110}
                />

                <div className="w-[1px] self-stretch" style={{ background: theme.borderCard }} />

                <Gauge
                    value={battery}
                    max={100}
                    label="Bateria"
                    unit="%"
                    color={batteryColor}
                    trackColor={trackColor}
                    valueColor={theme.textPrimary}
                    size={110}
                />
            </div>

            {/* Status de Ignição — ABAIXO dos relógios, sem sobreposição */}
            <div
                className="flex items-center justify-center gap-2 pt-1 border-t"
                style={{ borderColor: theme.borderCard }}
            >
                <div
                    className={`w-2 h-2 rounded-full ${ignitionOn ? 'animate-pulse' : ''}`}
                    style={{
                        background: ignitionOn ? theme.accent : theme.textMuted,
                        boxShadow: ignitionOn ? `0 0 6px ${theme.accent}` : 'none',
                    }}
                />
                <span
                    className="text-[9px] font-black tracking-widest uppercase"
                    style={{ color: ignitionOn ? theme.accent : theme.textMuted }}
                >
                    Motor: {ignitionOn ? 'Ligado' : 'Desligado'}
                </span>
            </div>
        </div>
    );
};

export default TacticalGauges;
