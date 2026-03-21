import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';

import MapIcon from '@mui/icons-material/Map';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PersonIcon from '@mui/icons-material/Person';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

import { sessionActions } from '../../store';
import { nativePostMessage } from './NativeInterface';
import { apiUrl } from '../util/apiUrl';
import { auditLog } from '../util/audit';

const NavItem = ({ icon, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 focus:outline-none border border-transparent ${active
      ? 'bg-[#39ff14]/10 border-[#39ff14]/20 shadow-[0_0_15px_rgba(57,255,20,0.1)]'
      : 'hover:bg-slate-800/40'
      }`}
  >
    <div className={`transition-all duration-300 ${active ? 'text-[#39ff14] drop-shadow-[0_0_8px_rgba(57,255,20,0.5)] scale-110' : 'text-slate-500'}`}>
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
    const notificationToken = window.localStorage.getItem('notificationToken');
    if (notificationToken && !user.readonly) {
      window.localStorage.removeItem('notificationToken');
    }
    auditLog('logout', { user_id: user.id, email: user.email });
    await fetch(apiUrl('/api/session'), { method: 'DELETE' });
    nativePostMessage('logout');
    navigate('/login');
    dispatch(sessionActions.updateUser(null));
  };

  const active = currentSelection();

  return (
    <div className="mx-auto flex h-[60px] items-center justify-around gap-2 px-3 bg-[#1e1f24]/85 backdrop-blur-xl rounded-full border border-white/5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] no-scrollbar border-slate-700/10">
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
      <NavItem
        icon={<NotificationsIcon sx={{ fontSize: 20 }} />}
        active={active === 'alerts'}
        onClick={() => navigate('/app/reports')}
      />
      <NavItem
        icon={user?.readonly ? <ExitToAppIcon sx={{ fontSize: 20 }} /> : <PersonIcon sx={{ fontSize: 20 }} />}
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
