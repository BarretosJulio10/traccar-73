import { useEffect } from 'react';
import { supabase } from '../../integrations/supabase/client';

const usePwaInstallTracker = (tenantId) => {
  useEffect(() => {
    if (!tenantId) return;

    const handleInstall = async () => {
      const alreadyTracked = localStorage.getItem(`pwa_installed_${tenantId}`);
      if (alreadyTracked) return;

      try {
        await supabase.from('pwa_installations').insert({
          tenant_id: tenantId,
          user_agent: navigator.userAgent,
        });
        localStorage.setItem(`pwa_installed_${tenantId}`, 'true');
      } catch (err) {
        console.error('Error tracking PWA installation:', err);
      }
    };

    window.addEventListener('appinstalled', handleInstall);
    return () => window.removeEventListener('appinstalled', handleInstall);
  }, [tenantId]);
};

export default usePwaInstallTracker;
