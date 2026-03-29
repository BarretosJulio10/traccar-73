import { useState, useCallback, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useMediaQuery, useTheme } from '@mui/material';
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
import VehicleDetailsPanel from './main/VehicleDetailsPanel';
import StatusCard from './common/components/StatusCard';
import { devicesActions } from './store';
import usePwaInstallTracker from './common/util/usePwaInstallTracker';
import { useTenant } from './common/components/TenantProvider';
import { DEFAULT_TENANT_SLUG, DEMO_USER } from './common/util/constants';
import { demoService } from './core/services';

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
  const { tenant } = useTenant();
  usePwaInstallTracker(tenant?.id);

  const desktop = useMediaQuery(theme.breakpoints.up('md'));
  const isSettingsRoute = pathname.startsWith('/app/settings');
  const isGeofenceNew = pathname.startsWith('/app/geofence/new');
  const isDashboard = pathname === '/app' || pathname === '/app/' || pathname.startsWith('/app/geofence');
  
  const [demoMode, setDemoModeState] = useState(() => demoService.isActive());

  const setDemoMode = useCallback((value) => {
    setDemoModeState(value);
    if (value) demoService.enable();
    else demoService.disable();
  }, []);
  
  const initializingRef = useRef(false);
  const server = useSelector((state) => state.session.server);
  const user = useSelector((state) => state.session.user);
  const attributes = useSelector((state) => state.session.attributes);
  
  const selectedDeviceId = useSelector((state) => state.devices.selectedId);
  const positions = useSelector((state) => state.session.positions);
  const selectedPosition = positions[selectedDeviceId];
  
  const [fleetSearch, setFleetSearch] = useState('');
  const [fleetFilter, setFleetFilter] = useState(null);
  const [panelDeviceId, setPanelDeviceId] = useState(null);

  const initialized = useMemo(() => {
    return user !== null && (demoMode || (server !== null && attributes !== null));
  }, [user, server, attributes, demoMode]);

  const handleClosePanel = () => setPanelDeviceId(null);
  const handleOpenPanel = (id) => setPanelDeviceId(id);

  useEffect(() => {
    const handler = () => setPanelDeviceId(null);
    window.addEventListener('center-all', handler);
    return () => window.removeEventListener('center-all', handler);
  }, []);

  const acceptTerms = useCatch(async () => {
    const response = await fetchOrThrow(`/api/users/${user.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...user, attributes: { ...user.attributes, termsAccepted: true } }),
    });
    dispatch(sessionActions.updateUser(await response.json()));
  });

  // Consolidate initialization logic
  useEffectAsync(async () => {
    if (!server || initializingRef.current) return;
    
    // If URL has token, Navigation.jsx will handle it. Skip App restoration to avoid race.
    const hasToken = new URLSearchParams(search).has('token');
    if (hasToken && !user) return;

    try {
      initializingRef.current = true;
      
      // 1. Session Restoration
      let currentUser = user;
      if (!currentUser && !demoMode) {
        console.info('[App] Checking session status...');
        const response = await fetch(apiUrl('/api/session'), {
          headers: {
            'x-tenant-slug': localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG,
            'x-traccar-email': sessionStorage.getItem('traccarEmail') || localStorage.getItem('traccarEmail') || '',
          },
        });
        
        if (response.ok) {
          currentUser = await response.json();
          console.info(`[App] Session RESTORED for user: ${currentUser.email}`);
          dispatch(sessionActions.updateUser(currentUser));
        } else {
          console.info('[App] No session found. Redirecting to login.');
          const safePath = pathname.startsWith('/app') ? pathname + search : '/app';
          window.sessionStorage.setItem('postLogin', safePath);
          navigate('/login', { replace: true });
          initializingRef.current = false;
          return;
        }
      }

      // 2. Attributes Loading
      if (currentUser && attributes === null) {
        if (!demoMode) {
          console.info('[App] Loading computed attributes...');
          try {
            const response = await fetchOrThrow('/api/attributes/computed?all=true');
            const data = await response.json();
            console.info(`[App] ${data.length} attributes loaded.`);
            dispatch(sessionActions.updateAttributes(data));
          } catch (e) {
            console.warn('[App] Attributes fetch failed, using empty array.');
            dispatch(sessionActions.updateAttributes([]));
          }
        } else {
          dispatch(sessionActions.updateAttributes([]));
        }
      }
    } catch (e) {
      console.error('[App] Initialization error:', e);
      if (pathname.startsWith('/app')) {
        navigate('/login', { replace: true });
      }
    } finally {
      initializingRef.current = false;
    }
  }, [server, user, attributes, demoMode]);

  useEffect(() => {
    if (demoMode && !user) {
      dispatch(sessionActions.updateUser(DEMO_USER));
    }
  }, [demoMode, user, dispatch]);

  // Loading state with clear indicators
  if (!initialized) {
    if (user && server && !attributes) {
      console.info('[App] Waiting for attributes...');
    } else if (!user) {
      console.info('[App] Waiting for user session...');
    }
    return <Loader />;
  }

  if (server?.attributes?.termsUrl && !demoMode && !user.attributes.termsAccepted) {
    return <TermsDialog open onCancel={() => navigate('/login')} onAccept={() => acceptTerms()} />;
  }

  return (
    <div
      className={`w-screen overflow-hidden flex ${desktop ? 'flex-row' : 'flex-col'} transition-colors duration-500`}
      style={{ height: '100dvh', background: hudTheme.bg }}
    >
      {/* Logic Controllers */}
      <SocketController demoMode={demoMode} />
      <CachingController demoMode={demoMode} />
      <UpdateController />
      <MotionController demoMode={demoMode} />
      <DemoController active={demoMode} />

      {/* Main UI Components */}
      {desktop && (
        <FleetSidebar 
          search={fleetSearch} 
          setSearch={setFleetSearch} 
          fleetFilter={fleetFilter} 
          setFleetFilter={setFleetFilter} 
          onOpenPanel={handleOpenPanel} 
          onClosePanel={handleClosePanel} 
          panelDeviceId={panelDeviceId} 
        />
      )}

      <div className="flex-1 relative flex flex-col min-w-0">
        {desktop && isSettingsRoute && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <MainMap filteredPositions={[]} selectedPosition={null} onEventsClick={() => { }} />
          </div>
        )}
        <div
          className="flex-1 relative overflow-auto scrollbar-hide"
          style={{ 
            WebkitOverflowScrolling: 'touch', 
            overscrollBehaviorY: 'contain', 
            zIndex: isGeofenceNew ? 50 : 10 
          }}
        >
          <Outlet context={{ demoMode, setDemoMode, fleetFilter, setFleetFilter }} />
        </div>
        
        {!desktop && selectedDeviceId && !isDashboard && (
          <StatusCard
            deviceId={selectedDeviceId}
            position={selectedPosition}
            onClose={() => dispatch(devicesActions.selectId(null))}
            desktopPadding={theme.dimensions.drawerWidthDesktop}
          />
        )}
        
        {!desktop && (
          <div
            className="px-4 pt-2"
            style={{
              paddingBottom: 'calc(8px + env(safe-area-inset-bottom, 0px))',
              background: hudTheme.bg,
            }}
          >
            <BottomMenu />
          </div>
        )}
        
        {desktop && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100]">
            <BottomMenu />
          </div>
        )}
      </div>

      {/* Details Panel (Desktop) */}
      {desktop && panelDeviceId && !isGeofenceNew && (
        <div
          className="w-[420px] h-full backdrop-blur-xl z-20 flex flex-col transition-colors duration-500 overflow-hidden"
          style={{
            background: hudTheme.isDark ? `${hudTheme.bg}e6` : `${hudTheme.bgSecondary}f0`,
            borderLeft: `1px solid ${hudTheme.border}`,
            boxShadow: hudTheme.isDark ? '-10px 0 40px rgba(0,0,0,0.5)' : '-4px 0 20px rgba(0,0,0,0.08)',
          }}
        >
          <VehicleDetailsPanel deviceId={panelDeviceId} onClose={handleClosePanel} />
        </div>
      )}
    </div>
  );
};

export default App;
