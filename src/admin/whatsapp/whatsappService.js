import { supabase } from '../../integrations/supabase/client';

const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'foifugnuaehjtjftpkrk';
const EDGE_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

const getAuthHeaders = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');
  return {
    Authorization: `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  };
};

const callProxy = async (action, body = null, params = {}) => {
  const headers = await getAuthHeaders();
  const queryParams = new URLSearchParams({ action, ...params });
  const url = `${EDGE_BASE}/whatsapp-proxy?${queryParams}`;

  const options = { headers };
  if (body) {
    options.method = 'POST';
    options.body = JSON.stringify(body);
  } else {
    options.method = 'GET';
  }

  const res = await fetch(url, options);
  const data = await res.json();
  if (!res.ok || !data.success) {
    const err = new Error(data.message || 'Request failed');
    err.statusCode = res.status;
    throw err;
  }
  return data;
};

export const whatsappService = {
  createInstance: () => callProxy('create-instance', {}),

  getConnectionStatus: () => callProxy('connect'),

  disconnect: () => callProxy('disconnect', {}),

  sendText: (phone, message, messageType = 'manual') =>
    callProxy('send-text', { phone, message, messageType }),

  getAlerts: () => callProxy('get-alerts'),

  saveAlerts: (alerts) => callProxy('save-alerts', { alerts }),

  getMessages: (limit = 50) => callProxy('get-messages', null, { limit: String(limit) }),

  setWebhook: (webhookUrl) => callProxy('set-webhook', { webhookUrl }),
};

export default whatsappService;
