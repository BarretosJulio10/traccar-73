// Centralized constants for the application
// Avoids hardcoding business-specific values across multiple files

export const DEFAULT_TENANT_SLUG = import.meta.env.VITE_DEFAULT_TENANT_SLUG || 'mabtracker';

export const PRODUCT_NAME = 'HyperTraccar';

export const COMPACT_HEIGHT = 80;
export const EXPANDED_HEIGHT = 320;
export const DEMO_USER = {
  id: 99999,
  name: 'Cliente Demo',
  email: 'demo@mabtracker.com.br',
  administrator: true,
  readonly: false,
  deviceReadonly: false,
  userLimit: 10,
  attributes: {},
};
