import { useSelector } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';

import MainMap from './MainMap';
import { useHudTheme } from '../common/util/ThemeContext';

const MapPage = () => {
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const devices = useSelector((state) => state.devices.items);

  const muiTheme = useTheme();
  const desktop = useMediaQuery(muiTheme.breakpoints.up('md'));
  const { theme } = useHudTheme();

  const deviceList = Object.values(devices);
  const positionList = Object.values(positions);
  const stats = [
    { label: 'Total',    value: deviceList.length,                                        color: theme.textPrimary },
    { label: 'Online',   value: deviceList.filter(d => d.status === 'online').length,     color: '#22c55e' },
    { label: 'Offline',  value: deviceList.filter(d => d.status === 'offline').length,    color: '#f59e0b' },
    { label: 'Movendo',  value: positionList.filter(p => p.speed > 0).length,             color: theme.accent },
    { label: 'Parados',  value: positionList.filter(p => p.speed === 0).length,           color: theme.textSecondary },
    { label: 'Sem Sinal',value: deviceList.filter(d => d.status === 'unknown').length,    color: '#ef4444' },
  ];

  return (
    <div className={`relative w-full overflow-hidden bg-[#1e1f24] font-['Quicksand']`} style={{ height: '100%', minHeight: 0 }}>

      {/* 100% Full Screen Map */}
      <div className="absolute inset-0 z-0">
        <MainMap
          filteredPositions={Object.values(positions)}
          selectedPosition={selectedDeviceId ? positions[selectedDeviceId] : null}
          onEventsClick={() => { }}
        />
      </div>

      {/* Desktop Stats Bar */}
      {desktop && (
        <div
          className="absolute left-1/2 -translate-x-1/2 z-[1900] flex items-center gap-0 rounded-2xl border shadow-xl backdrop-blur-xl overflow-hidden"
          style={{
            top: 5,
            background: theme.isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.82)',
            borderColor: theme.border,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={s.label}
              className="flex items-center gap-2.5 px-5 py-3"
              style={{ borderLeft: i > 0 ? `1px solid ${theme.border}` : 'none' }}
            >
              <span className="text-[18px] font-black leading-none" style={{ color: s.color }}>{s.value}</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: theme.textMuted }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};

export default MapPage;
