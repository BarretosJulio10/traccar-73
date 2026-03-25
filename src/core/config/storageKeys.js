// ─── Storage Keys — fonte canônica de todas as chaves de localStorage/sessionStorage ───
// Nunca use strings literais espalhadas pelo código. Importe daqui.

export const STORAGE = {
  // Tenant & sessão
  TENANT_SLUG:        'tenantSlug',
  TRACCAR_EMAIL:      'traccarEmail',
  NOTIFICATION_TOKEN: 'notificationToken',
  HUD_THEME:          'hudTheme',
  TENANT_CONFIG:      'tenantConfig',

  // Funcionalidades de âncora
  ANCHORS:                   'traccar_anchors',
  ANCHOR_AUTOBLOCK:          'traccar_anchor_autoblock',
  ANCHOR_AUTOBLOCK_GEOFENCE: 'traccar_anchor_autoblock_geofence',

  // PWA / install
  PWA_INSTALL_SHOWN:  'pwaInstallShown',
  PWA_INSTALLED:      'pwaInstalled',
};

export const SESSION = {
  DEMO_MODE:    'demoMode',
  POST_LOGIN:   'postLogin',
  SESSION_EXP:  'sessionExpired',
};

/**
 * Returns a tenant-scoped localStorage key.
 * Prevents key collisions when multiple tenants share the same device/browser.
 */
export const scopedKey = (baseKey) => {
  const slug = localStorage.getItem(STORAGE.TENANT_SLUG) || 'default';
  return `${slug}:${baseKey}`;
};
