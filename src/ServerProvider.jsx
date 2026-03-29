import { useState } from 'react';
import { Alert, IconButton } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useEffectAsync } from './reactHelper';
import { sessionActions } from './store';
import Loader from './common/components/Loader';
import { apiUrl } from './common/util/apiUrl';
import { DEFAULT_TENANT_SLUG } from './common/util/constants';
import { demoService } from './core/services';

// Routes that don't need the Traccar server to be loaded
const PUBLIC_ROUTES = ['/', '/landing', '/onboarding', '/admin/login', '/admin', '/login', '/register', '/reset-password', '/change-server', '/install'];

const ServerProvider = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const initialized = useSelector((state) => state.session.server?.id != null);

  const [error, setError] = useState(null);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  const demoMode = demoService.isActive();

  useEffectAsync(async () => {
    if (!error && !isPublicRoute && !demoMode) {
      const tenantSlug = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
      console.info(`[ServerProvider] Initializing for tenant: ${tenantSlug}`);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        // Optimized: We no longer fetch tenant metadata here as it is handled by TenantProvider.
        // We proceed directly to fetch Traccar server info via the proxy.

        console.info(`[ServerProvider] Fetching server config via proxy...`);
        const response = await fetch(apiUrl('/api/server'), {
          headers: {
            'x-tenant-slug': tenantSlug,
            'x-traccar-email': sessionStorage.getItem('traccarEmail') || localStorage.getItem('traccarEmail') || '',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw Error('Resposta inválida do servidor (não JSON). Verifique o endereço do servidor Traccar.');
          }
          const serverInfo = await response.json();
          console.info(`[ServerProvider] Server initialized: ${serverInfo.version || 'unknown'}`);
          dispatch(sessionActions.updateServer(serverInfo));
        } else {
          let message;
          try {
            const data = await response.json();
            message = data.error || response.statusText;
          } catch {
            const text = await response.text();
            message = text || response.statusText;
          }
          throw Error(message);
        }
      } catch (err) {
        clearTimeout(timeoutId);
        console.error(`[ServerProvider] Initialization failed:`, err.message);
        if (err.name === 'AbortError') {
          setError('O servidor demora muito a responder. Verifique se o endereço IP do Traccar está correto e acessível.');
        } else {
          setError(err.message);
        }
      }
    }
  }, [error, isPublicRoute]);

  // Public routes render immediately without waiting for server
  if (isPublicRoute) {
    return children;
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <IconButton color="inherit" size="small" onClick={() => setError(null)}>
            <ReplayIcon fontSize="inherit" />
          </IconButton>
        }
      >
        {error}
      </Alert>
    );
  }
  if (!initialized && !demoMode) {
    return <Loader />;
  }
  return children;
};

export default ServerProvider;
