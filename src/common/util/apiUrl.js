const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

if (!supabaseProjectId) {
  // eslint-disable-next-line no-console
  console.warn('[apiUrl] VITE_SUPABASE_PROJECT_ID não definido. Requisições de API falharão.');
}

export const EDGE_FUNCTION_BASE = supabaseProjectId
  ? `https://${supabaseProjectId}.supabase.co/functions/v1`
  : '';

export const apiUrl = (path) => {
  return `${EDGE_FUNCTION_BASE}/traccar-proxy?path=${encodeURIComponent(path)}`;
};

// Keep API_BASE for backward compatibility but it now points to the proxy
export const API_BASE = EDGE_FUNCTION_BASE;
