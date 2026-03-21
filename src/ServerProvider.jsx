import { useState } from 'react';
import { Alert, IconButton } from '@mui/material';
import ReplayIcon from '@mui/icons-material/Replay';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useEffectAsync } from './reactHelper';
import { sessionActions } from './store';
import Loader from './common/components/Loader';
import { apiUrl } from './common/util/apiUrl';
import { DEFAULT_TENANT_SLUG } from './common/util/constants';

// Routes that don't need the Traccar server to be loaded
const PUBLIC_ROUTES = ['/', '/landing', '/onboarding', '/admin/login', '/admin'];

const ServerProvider = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();

  const initialized = useSelector((state) => !!state.session.server);
  const [error, setError] = useState(null);

  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname);

  useEffectAsync(async () => {
    if (!error && !isPublicRoute) {
      try {
        const tenantSlug = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;

        // Validate tenant has a real traccar_url before calling proxy
        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL || 'https://foifugnuaehjtjftpkrk.supabase.co';
        const supabaseKey =
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaWZ1Z251YWVoanRqZnRwa3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDc5MjIsImV4cCI6MjA4ODM4MzkyMn0.4nYVYZu8FCN4-aJ1NxytL-jFRN07VHDZzFYT0dmEDDo';
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
            'x-traccar-email': localStorage.getItem('traccarEmail') || '',
          },
        });
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            throw Error('Unexpected response from Traccar server. Please check configuration.');
          }
          dispatch(sessionActions.updateServer(await response.json()));
        } else {
          const message = await response.text();
          throw Error(message || response.statusText);
        }
      } catch (error) {
        setError(error.message);
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
  if (!initialized) {
    return <Loader />;
  }
  return children;
};

export default ServerProvider;
