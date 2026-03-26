import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { devicesActions } from '../store';
import { useHudTheme } from '../common/util/ThemeContext';
import LogoImage from '../login/LogoImage';
import DeviceRow from './DeviceRow';

const STAT_DEFS = [
  { label: 'Total',    key: null,       color: null },
  { label: 'Online',   key: 'online',   color: '#22c55e' },
  { label: 'Offline',  key: 'offline',  color: '#f59e0b' },
  { label: 'Movendo',  key: 'moving',   color: null },   // accent
  { label: 'Parados',  key: 'stopped',  color: null },   // textSecondary
  { label: 'Sem Sinal',key: 'nosignal', color: '#ef4444' },
];

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const themeMui = useTheme();
  const { theme } = useHudTheme();
  const desktop = useMediaQuery(themeMui.breakpoints.up('md'));
  const { fleetFilter, setFleetFilter } = useOutletContext() || {};

  const user = useSelector((state) => state.session.user);
  const devices = useSelector((state) => state.devices.items);
  const positions = useSelector((state) => state.session.positions);

  const [search, setSearch] = useState('');
  const [anchorOpenId, setAnchorOpenId] = useState(null);

  // Desktop redirects to full map+sidebar layout
  useEffect(() => {
    if (desktop) {
      navigate('/app/map');
    }
  }, [desktop, navigate]);

  const deviceList = Object.values(devices);
  const positionList = Object.values(positions);

  const statValues = {
    null: deviceList.length,
    online: deviceList.filter(d => d.status === 'online').length,
    offline: deviceList.filter(d => d.status === 'offline').length,
    moving: positionList.filter(p => p.speed > 0).length,
    stopped: positionList.filter(p => p.speed === 0).length,
    nosignal: deviceList.filter(d => d.status === 'unknown').length,
  };

  const handleStatClick = (key) => {
    if (!setFleetFilter) return;
    setFleetFilter(prev => (prev === key || key === null) ? null : key);
  };

  let filteredDevices = deviceList;
  if (fleetFilter === 'online') filteredDevices = filteredDevices.filter(d => d.status === 'online');
  else if (fleetFilter === 'offline') filteredDevices = filteredDevices.filter(d => d.status === 'offline');
  else if (fleetFilter === 'nosignal') filteredDevices = filteredDevices.filter(d => d.status === 'unknown');
  else if (fleetFilter === 'moving') filteredDevices = filteredDevices.filter(d => (positions[d.id]?.speed ?? 0) > 0);
  else if (fleetFilter === 'stopped') filteredDevices = filteredDevices.filter(d => (positions[d.id]?.speed ?? 0) === 0);
  filteredDevices = filteredDevices.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));

  // Arrow click → select device and open map
  const handleOpenPanel = (deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
    navigate('/app/map');
  };

  return (
    <div
      className="flex flex-col font-['Quicksand'] transition-colors duration-500"
      style={{ background: theme.bg, height: '100%' }}
    >
      {/* Header */}
      <header className="px-4 pt-8 pb-3 shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner overflow-hidden"
              style={{ background: theme.bgSecondary, borderColor: theme.border }}
            >
              <LogoImage size={24} className="m-0" />
            </div>
            <div>
              <h1 className="text-xl font-black uppercase tracking-tight leading-none" style={{ color: theme.textPrimary }}>
                Meus <span style={{ color: theme.accent }}>Veículos</span>
              </h1>
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] mt-0.5" style={{ color: theme.textMuted }}>
                Bem-vindo, {user?.name || 'Comandante'}
              </p>
            </div>
          </div>
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center border shadow-lg"
            style={{ background: theme.bgSecondary, borderColor: theme.border }}
          >
            <span className="text-[14px] font-black" style={{ color: theme.accent }}>
              {Object.keys(devices).length}
            </span>
          </div>
        </div>

        {/* Stats bar */}
        <div
          className="flex items-center gap-0 rounded-2xl border overflow-hidden mb-3"
          style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
        >
          {STAT_DEFS.map((s, i) => {
            const color = s.color || (s.key === 'moving' ? theme.accent : theme.textSecondary) || theme.textPrimary;
            const isActive = fleetFilter === s.key && s.key !== null;
            return (
              <button
                key={s.label}
                type="button"
                onClick={() => handleStatClick(s.key)}
                className="flex-1 flex flex-col items-center py-2 transition-all active:scale-95"
                style={{
                  borderLeft: i > 0 ? `1px solid ${theme.borderCard}` : 'none',
                  background: isActive ? `${color}18` : 'transparent',
                }}
              >
                <span className="text-[15px] font-black leading-none" style={{ color }}>{statValues[s.key]}</span>
                <span className="text-[7px] font-bold uppercase tracking-wider mt-0.5" style={{ color: isActive ? color : theme.textMuted }}>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div
          className="rounded-xl flex items-center px-4 py-2.5 border"
          style={{ background: theme.bgSecondary, borderColor: theme.borderCard }}
        >
          <SearchIcon sx={{ color: theme.accent, fontSize: 18, opacity: 0.7 }} />
          <input
            type="text"
            placeholder="Buscar veículos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none ml-3 text-[13px] font-bold placeholder-slate-400"
            style={{ color: theme.textPrimary }}
          />
        </div>
      </header>

      {/* Device List — native scroll for touch support on PWA */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
        }}
      >
        {filteredDevices.map((_, index) => (
          <DeviceRow
            key={filteredDevices[index].id}
            index={index}
            style={{}}
            devices={filteredDevices}
            desktop={false}
            onOpenPanel={handleOpenPanel}
            onClosePanel={() => {}}
            panelDeviceId={null}
            anchorOpenId={anchorOpenId}
            setAnchorOpenId={setAnchorOpenId}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
