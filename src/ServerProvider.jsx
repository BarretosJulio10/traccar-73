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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const tenantSlug = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;

        // Validate tenant has a real traccar_url before calling proxy
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        if (!supabaseUrl || !supabaseKey) {
          throw Error('Configuração Supabase ausente. Verifique as variáveis de ambiente.');
        }
        const tenantRes = await fetch(
          `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(tenantSlug)}&select=traccar_url&limit=1`,
          { headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` } },
        );
        if (tenantRes.ok) {
          const tenants = await tenantRes.json();
          const traccarUrl = tenants?.[0]?.traccar_url;
          if (
            !traccarUrl ||
            traccarUrl.includes('pending-setup') ||
            traccarUrl.includes('example.com')
          ) {
            throw Error('Tracking server not configured yet. Please contact your administrator.');
          }
        }

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
            throw Error('Unexpected response from Traccar server. Please check configuration.');
          }
          dispatch(sessionActions.updateServer(await response.json()));
        } else {
          try {
            const data = await response.json();
            throw Error(data.error || response.statusText);
          } catch {
            const message = await response.text();
            throw Error(message || response.statusText);
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          setError('Tempo esgotado ao conectar com o servidor de rastreamento. Verifique sua conexão.');
        } else {
          setError(error.message);
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
