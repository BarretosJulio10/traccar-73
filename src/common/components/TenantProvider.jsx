import React, { createContext, useContext, useState, useEffect } from 'react';
import { EDGE_FUNCTION_BASE } from '../util/apiUrl';
import { DEFAULT_TENANT_SLUG } from '../util/constants';
import { applyBranding } from '../util/branding';

const TenantContext = createContext(null);

export const useTenant = () => useContext(TenantContext);

// Only allow safe slug characters — prevents open-redirect and injection
const TENANT_SLUG_RE = /^[a-z0-9_-]{2,60}$/;

const detectTenantSlug = () => {
  const params = new URLSearchParams(window.location.search);
  const queryTenant = params.get('tenant');
  if (queryTenant && TENANT_SLUG_RE.test(queryTenant)) return queryTenant;

  const stored = localStorage.getItem('tenantSlug');
  if (stored && TENANT_SLUG_RE.test(stored)) return stored;

  return DEFAULT_TENANT_SLUG;
};

export const TenantProvider = ({ children }) => {
  const [tenant, setTenant] = useState(null);
  const [tenantSlug, setTenantSlug] = useState(() => detectTenantSlug());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTenant = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
          throw new Error('Configuração Supabase ausente. Verifique as variáveis de ambiente.');
        }

        const response = await fetch(
          `${supabaseUrl}/rest/v1/tenants?slug=eq.${encodeURIComponent(tenantSlug)}&select=*&limit=1`,
          {
            headers: {
              apikey: supabaseKey,
              Authorization: `Bearer ${supabaseKey}`,
            },
            signal: controller.signal,
          },
        );

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data && data.length > 0) {
            const tenantData = data[0];
            setTenant(tenantData);
            
            // Store branding info for fast access in index.html script
            localStorage.setItem('tenantSlug', tenantData.slug);
            if (tenantData.logo_url) localStorage.setItem('tenantLogo', tenantData.logo_url);
            if (tenantData.company_name) localStorage.setItem('tenantName', tenantData.company_name);
            
            // Apply branding immediately to current page
            applyBranding(tenantData);
          }
        }
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          console.warn(`[TenantProvider] Timeout fetching tenant for slug: ${tenantSlug}`);
        } else {
          console.error('[TenantProvider] Error fetching tenant:', error.message);
        }
        // Silently fail — app will fall back to default tenant or stay with null tenant
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
