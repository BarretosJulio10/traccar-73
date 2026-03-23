import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery, useTheme } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';

import { devicesActions } from '../store';
import { useHudTheme } from '../common/util/ThemeContext';
import LogoImage from '../login/LogoImage';
import DeviceList from './DeviceList';

const DashboardPage = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const themeMui = useTheme();
  const { theme } = useHudTheme();
  const desktop = useMediaQuery(themeMui.breakpoints.up('md'));

  const user = useSelector((state) => state.session.user);
  const devices = useSelector((state) => state.devices.items);

  const [search, setSearch] = useState('');

  // Desktop redirects to full map+sidebar layout
  useEffect(() => {
    if (desktop) {
      navigate('/app/map');
    }
  }, [desktop, navigate]);

  const filteredDevices = Object.values(devices).filter((d) =>
    d.name.toLowerCase().includes(search.toLowerCase()),
  );

  // Arrow click → select device and open map
  const handleOpenPanel = (deviceId) => {
    dispatch(devicesActions.selectId(deviceId));
    navigate('/app/map');
  };

  return (
    <div
      className="flex flex-col font-['Quicksand'] transition-colors duration-500"
      style={{ background: theme.bg, height: '100dvh' }}
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

      {/* Device List — same component as desktop, card click expands, arrow opens map */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <DeviceList
          devices={filteredDevices}
          onOpenPanel={handleOpenPanel}
          onClosePanel={() => {}}
          panelDeviceId={null}
        />
      </div>

      {/* Bottom safe area spacer */}
      <div style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))', flexShrink: 0 }} />
    </div>
  );
};

export default DashboardPage;
