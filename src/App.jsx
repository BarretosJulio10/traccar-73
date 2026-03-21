import { useState, useCallback, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery, useTheme, SwipeableDrawer } from '@mui/material';
import { makeStyles } from 'tss-react/mui';
import { useHudTheme } from './common/util/ThemeContext';
import BottomMenu from './common/components/BottomMenu';
import SocketController from './SocketController';
import CachingController from './CachingController';
import { useCatch, useEffectAsync } from './reactHelper';
import { sessionActions } from './store';
import UpdateController from './UpdateController';
import MotionController from './main/MotionController';
import DemoController from './main/DemoController';
import TermsDialog from './common/components/TermsDialog';
import Loader from './common/components/Loader';
import fetchOrThrow from './common/util/fetchOrThrow';
import { apiUrl } from './common/util/apiUrl';
import MainMap from './main/MainMap';
import FleetSidebar from './main/FleetSidebar';
import MapSideMenu from './main/MapSideMenu';
import VehicleDetailsPanel from './main/VehicleDetailsPanel';
import StatusCard from './common/components/StatusCard';
import { devicesActions } from './store';
import usePwaInstallTracker from './common/util/usePwaInstallTracker';
import { useTenant } from './common/components/TenantProvider';
import { DEFAULT_TENANT_SLUG, DEMO_USER } from './common/util/constants';

const useStyles = makeStyles()(() => ({
  page: {
    flexGrow: 1,
    overflow: 'auto',
  },
  menu: {
    zIndex: 4,
    '@media print': {
      display: 'none',
    },
  },
}));

const App = () => {
  const { classes } = useStyles();
  const theme = useTheme();
  const { theme: hudTheme } = useHudTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { pathname, search } = useLocation();
  const tenant = useTenant();
  usePwaInstallTracker(tenant?.id);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const isSettingsRoute = pathname.startsWith('/app/settings');
  const [demoMode, setDemoModeState] = useState(
    () => window.sessionStorage.getItem('demoMode') === 'true',
  );

  const setDemoMode = useCallback((value) => {
    setDemoModeState(value);
    if (value) {
      window.sessionStorage.setItem('demoMode', 'true');
    } else {
      window.sessionStorage.removeItem('demoMode');
    }
  }, []);

  const newServer = useSelector((state) => state.session.server.newServer);
  const termsUrl = useSelector((state) => state.session.server.attributes.termsUrl);
  const user = useSelector((state) => state.session.user);
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const selectedPosition = positions[selectedDeviceId];
  const [fleetSearch, setFleetSearch] = useState('');

  const handleClosePanel = () => {
    dispatch(devicesActions.selectId(null));
  };

  const acceptTerms = useCatch(async () => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes: { ...user.attributes, termsAccepted: true } }),
    });
    dispatch(sessionActions.updateUser(await response.json()));
  });

  useEffectAsync(async () => {
    if (!user && !demoMode) {
      const response = await fetch(apiUrl('/api/session'), {
        headers: {
          'x-tenant-slug': localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG,
          'x-traccar-email': localStorage.getItem('traccarEmail') || '',
        },
      });
      if (response.ok) {
        dispatch(sessionActions.updateUser(await response.json()));
      } else {
        window.sessionStorage.setItem('postLogin', pathname + search);
        navigate(newServer ? '/register' : '/login', { replace: true });
      }
    }
    return null;
  }, [demoMode]);

  useEffect(() => {
    if (demoMode && !user) {
      dispatch(sessionActions.updateUser(DEMO_USER));
    }
  }, [demoMode, user, dispatch]);

  if (user == null) {
    return <Loader />;
  }
  if (termsUrl && !demoMode && !user.attributes.termsAccepted) {
    return <TermsDialog open onCancel={() => navigate('/login')} onAccept={() => acceptTerms()} />;
  }
  return (
    <div
      className={`h-screen w-screen overflow-hidden flex ${desktop ? 'flex-row' : 'flex-col'} transition-colors duration-500`}
      style={{ background: hudTheme.bg }}
    >
      <SocketController demoMode={demoMode} />
      <CachingController demoMode={demoMode} />
      <UpdateController />
      <MotionController demoMode={demoMode} />
      <DemoController active={demoMode} />

      {desktop && <FleetSidebar search={fleetSearch} setSearch={setFleetSearch} />}

      <div className="flex-1 relative flex flex-col min-w-0">
        {desktop && <MapSideMenu />}
        {desktop && isSettingsRoute && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <MainMap filteredPositions={[]} selectedPosition={null} onEventsClick={() => { }} />
          </div>
        )}
        <div className="flex-1 relative overflow-auto z-10 scrollbar-hide">
          <Outlet context={{ demoMode, setDemoMode }} />
        </div>
        {!desktop && !selectedDeviceId && <BottomMenu />}
        {desktop && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
            <BottomMenu />
          </div>
        )}
      </div>

      {desktop && selectedDeviceId && (
        <div
          className="w-[420px] h-full backdrop-blur-xl z-20 flex flex-col transition-colors duration-500 overflow-hidden"
          style={{
            background: hudTheme.isDark ? `${hudTheme.bg}e6` : `${hudTheme.bgSecondary}f0`,
            borderLeft: `1px solid ${hudTheme.border}`,
            boxShadow: hudTheme.isDark ? '-10px 0 40px rgba(0,0,0,0.5)' : '-4px 0 20px rgba(0,0,0,0.08)',
          }}
        >
          <VehicleDetailsPanel deviceId={selectedDeviceId} onClose={handleClosePanel} />
        </div>
      )}
      {!desktop && selectedDeviceId && (
        <div style={{ position: 'relative', zIndex: 1000 }}>
          <StatusCard
            deviceId={selectedDeviceId}
            position={selectedPosition}
            onClose={handleClosePanel}
            desktopPadding={theme.dimensions.drawerWidthDesktop}
          />
        </div>
      )}
    </div>
  );
};

export default App;
