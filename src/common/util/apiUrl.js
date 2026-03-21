const SUPABASE_PROJECT_ID = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'foifugnuaehjtjftpkrk';

export const EDGE_FUNCTION_BASE = `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1`;

export const apiUrl = (path) => {
  return `${EDGE_FUNCTION_BASE}/traccar-proxy?path=${encodeURIComponent(path)}`;
};

// Keep API_BASE for backward compatibility but it now points to the proxy
export const API_BASE = EDGE_FUNCTION_BASE;
