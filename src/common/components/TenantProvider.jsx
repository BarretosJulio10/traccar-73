import React, { createContext, useContext, useState, useEffect } from 'react';
import { EDGE_FUNCTION_BASE } from '../util/apiUrl';
import { DEFAULT_TENANT_SLUG } from '../util/constants';

const TenantContext = createContext(null);

export const useTenant = () => useContext(TenantContext);

const detectTenantSlug = () => {
  const params = new URLSearchParams(window.location.search);
  const queryTenant = params.get('tenant');
  if (queryTenant) return queryTenant;

  const stored = localStorage.getItem('tenantSlug');
  if (stored) return stored;

  return DEFAULT_TENANT_SLUG;
};

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [tenantSlug, setTenantSlug] = useState(() => detectTenantSlug());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const supabaseUrl =
          import.meta.env.VITE_SUPABASE_URL || 'https://foifugnuaehjtjftpkrk.supabase.co';
        const supabaseKey =
          import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaWZ1Z251YWVoanRqZnRwa3JrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDc5MjIsImV4cCI6MjA4ODM4MzkyMn0.4nYVYZu8FCN4-aJ1NxytL-jFRN07VHDZzFYT0dmEDDo';

        const response = await fetch(
          `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(tenantSlug)}&select=*&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
          },
        );

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            setTenant(data[0]);
            localStorage.setItem('tenantSlug', data[0].slug);
          } else {
            console.error('Tenant not found:', tenantSlug);
          }
        }
      } catch (err) {
        console.error('Error fetching tenant:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTenant();
  }, [tenantSlug]);

  const value = React.useMemo(() => ({ tenant, tenantSlug, setTenantSlug, loading }), [tenant, tenantSlug, loading]);

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export default TenantProvider;
