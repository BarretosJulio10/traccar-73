import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { Tooltip, Box } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import FenceIcon from '@mui/icons-material/Fence';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { sessionActions } from '../store';
import { auditLog } from '../common/util/audit';
import fetchOrThrow from '../common/util/fetchOrThrow';
import { useHudTheme } from '../common/util/ThemeContext';
import { useTranslation } from '../common/components/LocalizationProvider';

const NavHeaderItem = ({ icon, active, onClick, label, theme }) => (
  <Tooltip title={label} arrow>
    <button
      onClick={onClick}
      className={`relative w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-300 focus:outline-none border border-transparent ${active
        ? 'bg-cyan-500/10 border-cyan-500/20'
        : 'hover:bg-slate-100/80 active:scale-95'
        }`}
    >
      <div className={`transition-all duration-300 ${active ? 'text-cyan-500 scale-110' : 'text-slate-400'}`}>
        {React.cloneElement(icon, { sx: { fontSize: 20 } })}
      </div>
      {active && (
        <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
      )}
    </button>
  </Tooltip>
);

const DesktopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useTranslation();
  const { themeKey, toggleTheme, theme } = useHudTheme();
  const user = useSelector((state) => state.session.user);

  const currentSelection = () => {
    if (location.pathname === '/app') return 'vehicles';
    if (location.pathname === '/app/map') return 'map';
    if (location.pathname === '/app/geofences') return 'geofences';
    if (location.pathname.startsWith('/app/reports')) return 'reports';
    if (location.pathname.startsWith('/app/settings')) return 'settings';
    return null;
  };

  const active = currentSelection();

  const handleLogout = async () => {
    auditLog('logout', { user_id: user.id, email: user.email });
    await fetchOrThrow('/api/session', { method: 'DELETE' });
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  };

  return (
    <div 
      className="fixed top-[2px] left-1/2 -translate-x-1/2 z-[2000] flex items-center gap-1.5 px-2 py-1.5 backdrop-blur-3xl rounded-[22px] border border-white/40 shadow-[0_8px_30px_rgba(0,0,0,0.06)]"
      style={{ 
        backgroundColor: theme.isDark ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.85)',
      }}
    >
      <NavHeaderItem
        label="Veículos"
        icon={<DirectionsCarIcon />}
        active={active === 'vehicles'}
        onClick={() => navigate('/app')}
      />
      <NavHeaderItem
        label="Mapa"
        icon={<MapIcon />}
        active={active === 'map'}
        onClick={() => navigate('/app/map')}
      />
      <NavHeaderItem
        label="Cercas"
        icon={<FenceIcon />}
        active={active === 'geofences'}
        onClick={() => navigate('/app/geofences')}
      />
      <NavHeaderItem
        label="Relatórios"
        icon={<DescriptionIcon />}
        active={active === 'reports'}
        onClick={() => navigate('/app/reports/combined')}
      />

      <div className="w-[1px] h-6 mx-1 border-l border-slate-200" />

      <NavHeaderItem
        label="Ajustes"
        icon={<SettingsIcon />}
        active={active === 'settings'}
        onClick={() => navigate('/app/settings/preferences')}
      />

      <NavHeaderItem
        label={themeKey === 'dark' ? 'Modo Luz' : 'Modo Escuro'}
        icon={themeKey === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
        active={false}
        onClick={toggleTheme}
      />

      <NavHeaderItem
        label="Notificações"
        icon={<NotificationsIcon />}
        active={false}
        onClick={() => navigate('/app/reports/event')}
      />

      <NavHeaderItem
        label={user?.readonly ? 'Sair' : 'Minha Conta'}
        icon={user?.readonly ? <ExitToAppIcon /> : (
          <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white flex items-center justify-center font-black text-[10px] uppercase shadow-sm border-[1.5px] border-white/40">
            {user?.name ? user.name.substring(0, 2) : 'US'}
          </div>
        )}
        active={active === 'account'}
        onClick={() => {
          if (user?.readonly) handleLogout();
          else navigate(`/app/settings/user/${user.id}`);
        }}
      />
    </div>
  );
};

export default DesktopHeader;
