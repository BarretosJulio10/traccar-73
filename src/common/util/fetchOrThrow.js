import { apiUrl } from './apiUrl';
import { DEFAULT_TENANT_SLUG } from './constants';

const getTenantSlug = () => localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
const getTraccarEmail = () => localStorage.getItem('traccarEmail') || '';

// Static demo devices — shared with DemoController (keep IDs and names in sync)
const DEMO_DEVICES = [
  { id: 99901, name: 'Demo Van 01', uniqueId: 'DEMO001', category: 'van', status: 'online', disabled: false, attributes: {} },
  { id: 99902, name: 'Demo Carro 02', uniqueId: 'DEMO002', category: 'car', status: 'online', disabled: false, attributes: {} },
  { id: 99903, name: 'Demo Caminhão 03', uniqueId: 'DEMO003', category: 'truck', status: 'online', disabled: false, attributes: {} },
  { id: 99904, name: 'Demo Moto 04', uniqueId: 'DEMO004', category: 'motorcycle', status: 'online', disabled: false, attributes: {} },
  { id: 99905, name: 'Demo Pickup 05', uniqueId: 'DEMO005', category: 'car', status: 'online', disabled: false, attributes: {} },
];

// Mock storage for Demo Mode so created items persist during the session
const demoStorage = {
  geofences: [
    {
      id: 1001,
      name: 'Sede Demo',
      area: 'CIRCLE (-23.5505 -46.6333, 500)',
      attributes: { type: 'safe', color: '#39ff14' },
    },
    {
      id: 1002,
      name: 'Depósito Demo',
      area: 'CIRCLE (-23.52 -46.59, 800)',
      attributes: { type: 'default', color: '#3b82f6' },
    },
  ],
  groups: [],
  calendars: [],
};

/**
 * Maps raw technical error messages to user-friendly messages.
 */
const friendlyMessages = {
  'Failed to fetch': 'Não foi possível conectar ao servidor. Verifique sua conexão.',
  NetworkError: 'Erro de rede. Verifique sua conexão com a internet.',
  'Load failed': 'Falha ao carregar dados. Verifique sua conexão.',
  'Session expired': 'Sessão expirada. Faça login novamente.',
  'Unexpected server response': 'Resposta inesperada do servidor. Tente novamente.',
};

/**
 * Translates technical error messages to user-friendly Portuguese messages.
 */
const translateError = (rawMessage) => {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return 'Ocorreu um erro inesperado. Tente novamente.';
  }

  // Check direct matches
  for (const [key, friendly] of Object.entries(friendlyMessages)) {
    if (rawMessage.includes(key)) return friendly;
  }

  // JSON parse errors
  if (
    rawMessage.includes('is not valid JSON') ||
    rawMessage.includes('Unexpected token') ||
    rawMessage.includes('JSON.parse')
  ) {
    return 'O servidor retornou uma resposta inválida. Tente novamente mais tarde.';
  }

  // Java/Traccar backend exceptions
  if (rawMessage.includes('NullPointerException')) {
    return 'Erro interno do servidor. Verifique os dados e tente novamente.';
  }
  if (rawMessage.includes('Exception') || rawMessage.includes('java.')) {
    const cleanMsg = rawMessage
      .replace(/^(?:(?:[\w$.]+\.)*[\w$]+(?:Exception|Error)?:\s*)+/i, '')
      .trim();
    return cleanMsg || 'Erro interno do servidor. Tente novamente.';
  }

  // HTTP status codes
  if (rawMessage.includes('403') || rawMessage.toLowerCase().includes('forbidden')) {
    return 'Você não tem permissão para realizar esta ação.';
  }
  if (rawMessage.includes('404') || rawMessage.toLowerCase().includes('not found')) {
    return 'Recurso não encontrado. Pode ter sido removido.';
  }
  if (rawMessage.includes('409') || rawMessage.toLowerCase().includes('conflict')) {
    return 'Conflito: este registro já existe ou está em uso.';
  }
  if (rawMessage.includes('500') || rawMessage.toLowerCase().includes('internal server error')) {
    return 'Erro interno do servidor. Tente novamente mais tarde.';
  }

  // If message is too technical (contains stack traces, class names, etc.)
  if (rawMessage.length > 200 || /[\w.]+Exception|at\s+[\w.$]+\(/.test(rawMessage)) {
    return 'Erro no servidor. Tente novamente ou contate o suporte.';
  }

  return rawMessage;
};

const fetchOrThrow = async (input, init) => {
  const isDemo = window.sessionStorage.getItem('demoMode') === 'true';
  const url = typeof input === 'string' && input.startsWith('/api') ? apiUrl(input) : input;

  // Intercept non-GET requests in demo mode to "liberate" all functions
  // and simulate local storage behavior for Geofences
  if (isDemo && init && init.method && init.method !== 'GET') {
    if (init.method === 'POST') {
      let bodyJSON = {};
      try { bodyJSON = init.body ? JSON.parse(init.body) : {}; } catch { /* non-JSON body */ }
      const newId = Math.floor(Math.random() * 100000);
      const newItem = { id: newId, ...bodyJSON };
      if (url.includes('/api/geofences')) demoStorage.geofences.push(newItem);
      else if (url.includes('/api/groups')) demoStorage.groups.push(newItem);
      else if (url.includes('/api/calendars')) demoStorage.calendars.push(newItem);
      
      return new Response(JSON.stringify(newItem), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (init.method === 'PUT') {
      let bodyJSON = {};
      try { bodyJSON = init.body ? JSON.parse(init.body) : {}; } catch { /* non-JSON body */ }
      if (url.includes('/api/geofences') && bodyJSON.id) {
        demoStorage.geofences = demoStorage.geofences.map(g => g.id === bodyJSON.id ? bodyJSON : g);
      }
      return new Response(JSON.stringify(bodyJSON), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (init.method === 'DELETE') {
      const idMatch = url.match(/\/api\/(geofences|groups|calendars)\/(\d+)/);
      if (idMatch) {
        const [, type, id] = idMatch;
        demoStorage[type] = demoStorage[type].filter(item => item.id !== Number(id));
      }
      return new Response(null, { status: 204 });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Intercept ALL GET requests in demo mode — prevents real tenant data from leaking
  if (isDemo && (!init || !init.method || init.method === 'GET')) {
    // Pass through only session/server — needed for auth bootstrap
    const isBootstrap = url.includes('/api/session') || url.includes('/api/server');
    if (!isBootstrap) {
      if (url.includes('/api/geofences')) return new Response(JSON.stringify(demoStorage.geofences), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (url.includes('/api/groups')) return new Response(JSON.stringify(demoStorage.groups), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (url.includes('/api/calendars')) return new Response(JSON.stringify(demoStorage.calendars), { status: 200, headers: { 'Content-Type': 'application/json' } });
      if (url.includes('/api/devices')) return new Response(JSON.stringify(DEMO_DEVICES), { status: 200, headers: { 'Content-Type': 'application/json' } });
      // Catch-all: any other GET in demo mode returns empty array (never real tenant data)
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
  }

  const headers = {
    ...(init?.headers || {}),
    'x-tenant-slug': getTenantSlug(),
    'x-traccar-email': getTraccarEmail(),
  };

  // Add Content-Type for POST/PUT/PATCH if body is URLSearchParams
  if (init?.body instanceof URLSearchParams && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/x-www-form-urlencoded';
  }

  let response;
  try {
    response = await fetch(url, { ...init, headers });
  } catch (networkError) {
    if (isDemo) {
      const isObjectEndpoint = url.includes('/api/session') || url.includes('/api/server');
      const mockResponse = (init?.method === 'GET' || !init?.method) && !isObjectEndpoint ? [] : { success: true };
      return new Response(JSON.stringify(mockResponse), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(translateError(networkError.message));
  }

  if (!response.ok) {
    if (response.status === 401) {
      if (!isDemo) {
        const loginPath = '/login';
        if (window.location.pathname !== loginPath) {
          window.sessionStorage.setItem('sessionExpired', 'true');
          window.location.href = loginPath;
        }
        throw new Error('Sessão expirada. Faça login novamente.');
      } else {
        // In demo mode, treat 401 as success to unblock UI
        const isObjectEndpoint = url.includes('/api/session') || url.includes('/api/server');
        const mockResponse = (init?.method === 'GET' || !init?.method) && !isObjectEndpoint ? [] : { success: true };
        return new Response(JSON.stringify(mockResponse), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
      if (isDemo) {
        const isObjectEndpoint = url.includes('/api/session') || url.includes('/api/server');
        const mockResponse = (init?.method === 'GET' || !init?.method) && !isObjectEndpoint ? [] : { success: true };
        return new Response(JSON.stringify(mockResponse), { status: 200, headers: { 'Content-Type': 'application/json' } });
      }
      throw new Error('Resposta inesperada do servidor. Verifique sua conexão.');
    }

    let errorText;
    try {
      errorText = await response.text();
    } catch {
      errorText = `Erro ${response.status}`;
    }

    if (isDemo) {
      const isObjectEndpoint = url.includes('/api/session') || url.includes('/api/server');
      const mockResponse = (init?.method === 'GET' || !init?.method) && !isObjectEndpoint ? [] : { success: true };
      return new Response(JSON.stringify(mockResponse), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    throw new Error(translateError(errorText));
  }

  // Wrap response with safe .json() method
  const originalJson = response.json.bind(response);
  response.json = async () => {
    try {
      return await originalJson();
    } catch (parseError) {
      if (isDemo) return [];
      throw new Error('O servidor retornou uma resposta inválida. Tente novamente mais tarde.');
    }
  };

  return response;
};

export default fetchOrThrow;
export { translateError };
