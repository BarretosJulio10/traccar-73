// ─── Feature Flags — definição canônica ───────────────────────────────────────
// Fonte única de verdade para todas as flags de UI.
// Consumido por useFeatures() em common/util/useFeatures.js
// Em futuras fases, este arquivo definirá também os defaults e dependências.

/**
 * Mapa de flags → chave no atributo server/user
 * Hierarquia: uma flag pai pode desabilitar filhas automaticamente.
 */
export const FEATURE_KEYS = {
  // Comandos
  DISABLE_SAVED_COMMANDS:     'ui.disableSavedCommands',

  // Veículos / frota (pai)
  DISABLE_VEHICLE_FEATURES:   'ui.disableVehicleFeatures',
  // Filhos de DISABLE_VEHICLE_FEATURES:
  DISABLE_DRIVERS:            'ui.disableDrivers',
  DISABLE_MAINTENANCE:        'ui.disableMaintenance',

  // Eventos / alertas
  DISABLE_EVENTS:             'ui.disableEvents',

  // Atributos e computed
  DISABLE_ATTRIBUTES:         'ui.disableAttributes',
  DISABLE_COMPUTED_ATTR:      'ui.disableComputedAttributes',

  // Agendamentos
  DISABLE_CALENDARS:          'ui.disableCalendars',

  // Grupos
  DISABLE_GROUPS:             'ui.disableGroups',

  // Compartilhamento
  DISABLE_SHARE:              'ui.disableShare',
};

/**
 * Flags que são herdadas de uma flag pai.
 * Se a flag pai for true, a filha também é true.
 */
export const FEATURE_INHERITANCE = {
  [FEATURE_KEYS.DISABLE_DRIVERS]:     FEATURE_KEYS.DISABLE_VEHICLE_FEATURES,
  [FEATURE_KEYS.DISABLE_MAINTENANCE]: FEATURE_KEYS.DISABLE_VEHICLE_FEATURES,
};
