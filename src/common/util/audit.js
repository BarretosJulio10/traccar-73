import { supabase } from '../../integrations/supabase/client';

export const auditLog = async (action, details = {}) => {
  if (!supabase) return;

  try {
    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    
    const log = {
      user_id: user?.id || details.user_id || null,
      email: user?.email || details.email || null,
      action,
      details,
      ip_address: null, // Client-side cannot reliably get public IP without external service
      user_agent: window.navigator.userAgent,
    };

    const { error } = await supabase
      .from('audit_logs')
      .insert([log]);

    if (error) console.error('Audit log error:', error);
  } catch (err) {
    console.error('Audit log critical fail:', err);
  }
};
