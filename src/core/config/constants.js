// ─── Core Constants ─────────────────────────────────────────────────────────
// Fonte canônica. O arquivo legado src/common/util/constants.js
// re-exporta daqui para manter compatibilidade durante a migração.

export const DEFAULT_TENANT_SLUG = import.meta.env.VITE_DEFAULT_TENANT_SLUG || 'mabtracker';
export const PRODUCT_NAME = 'HyperTraccar';

// ── DeviceRow / DeviceList heights (react-window) ──
export const COMPACT_HEIGHT        = 80;
export const EXPANDED_HEIGHT       = 430;
export const ANCHOR_EXPANDED_HEIGHT = 540;

// ── Demo user ──
export const DEMO_USER = {
  id: 99999,
  name: 'Cliente Demo',
  email: 'demo@mabtracker.com.br',
  administrator: false,
  readonly: false,
  deviceReadonly: false,
  userLimit: 0,
  attributes: {},
};

// ── Modelos de UI disponíveis ──
export const UI_MODELS = {
  DEFAULT: 'default',
  COMPACT: 'compact',
  FLEET:   'fleet',
};
