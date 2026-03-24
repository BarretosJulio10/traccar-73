import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import MapIcon from '@mui/icons-material/Map';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { resetAll } from '../../store';
import { nativePostMessage } from './NativeInterface';
import { auditLog } from '../util/audit';
import fetchOrThrow from '../util/fetchOrThrow';
import { useHudTheme } from '../util/ThemeContext';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';

const NavItem = ({ icon, active, onClick, color }) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 focus:outline-none border border-transparent ${active
      ? 'bg-[var(--hud-accent)]/10 border-[var(--hud-accent)]/20 shadow-[0_0_15px_rgba(var(--hud-accent-rgb),0.1)]'
      : 'hover:bg-black/10'
      }`}
  >
    <div className={`transition-all duration-300 ${active ? 'text-[var(--hud-accent)] drop-shadow-[0_0_8px_rgba(var(--hud-accent-rgb),0.5)] scale-110' : 'text-[var(--hud-text2)]'}`}>
      {icon}
    </div>
  </button>
);

const BottomMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.session.user);

  const currentSelection = () => {
    if (location.pathname === '/app') return 'vehicles';
    if (location.pathname === '/app/map') return 'map';
    if (location.pathname.startsWith('/app/reports')) return 'alerts';
    if (location.pathname.startsWith('/app/settings/user')) return 'account';
    return null;
  };

  const handleLogout = async () => {
    auditLog('logout', { user_id: user.id, email: user.email });
    try { await fetchOrThrow('/api/session', { method: 'DELETE' }); } catch { /* proceed */ }
    nativePostMessage('logout');
    // Wipe all tenant data from Redux store
    dispatch(resetAll());
    // Clear user-specific localStorage keys so next user starts fresh
    ['notificationToken', 'traccar_anchor_autoblock', 'traccar_anchors', 'traccarEmail'].forEach(
      (key) => window.localStorage.removeItem(key),
    );
    // Clear session flags
    ['sessionExpired', 'postLogin'].forEach((key) => window.sessionStorage.removeItem(key));
    navigate('/login');
  };

  const active = currentSelection();
  const { themeKey, toggleTheme, theme } = useHudTheme();

  return (
    <div 
      className="mx-auto flex h-[64px] items-center justify-around gap-2 px-3 backdrop-blur-3xl rounded-full border shadow-2xl no-scrollbar"
      style={{ 
        background: theme.isDark ? 'rgba(8, 9, 10, 0.85)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: theme.border,
      }}
    >
      <NavItem
        icon={<DirectionsCarIcon sx={{ fontSize: 20 }} />}
        active={active === 'vehicles'}
        onClick={() => navigate('/app')}
      />
      <NavItem
        icon={<MapIcon sx={{ fontSize: 20 }} />}
        active={active === 'map'}
        onClick={() => navigate('/app/map')}
      />
      
      <div className="w-[1px] h-6 mx-1 opacity-20" style={{ background: theme.textSecondary }} />

      <NavItem
        icon={themeKey === 'dark' ? <LightModeIcon sx={{ fontSize: 20 }} /> : <DarkModeIcon sx={{ fontSize: 20 }} />}
        active={false}
        onClick={toggleTheme}
      />

      <div className="w-[1px] h-6 mx-1 opacity-20" style={{ background: theme.textSecondary }} />

      <NavItem
        icon={<NotificationsIcon sx={{ fontSize: 20 }} />}
        active={active === 'alerts'}
        onClick={() => navigate('/app/reports')}
      />
      <NavItem
        icon={user?.readonly ? <ExitToAppIcon sx={{ fontSize: 20 }} /> : (
          <div className="w-[22px] h-[22px] rounded-full bg-gradient-to-br from-cyan-400 to-cyan-600 text-white flex items-center justify-center font-black text-[9px] uppercase shadow-sm border border-white/20">
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

export default BottomMenu;
