// ─── Model Registry ───────────────────────────────────────────────────────────
// Fonte canônica de todos os modelos de UI disponíveis.
// Para adicionar um novo modelo:
//   1. Crie a pasta src/models/meu-modelo/
//   2. Exporte AppShell como default em src/models/meu-modelo/index.js
//   3. Registre abaixo

import { UI_MODELS } from '../core/config/constants';

const REGISTRY = {
  [UI_MODELS.DEFAULT]: () => import('./default'),
  // [UI_MODELS.COMPACT]: () => import('./compact'),
  // [UI_MODELS.FLEET]:   () => import('./fleet'),
};

/**
 * Carrega dinamicamente um modelo pelo key.
 * Retorna o módulo com { AppShell, theme }.
 * @param {string} modelKey — ex: 'default', 'compact', 'fleet'
 */
export const loadModel = (modelKey) => {
  const loader = REGISTRY[modelKey] || REGISTRY[UI_MODELS.DEFAULT];
  return loader();
};

/** Lista de modelos registrados (para UI de seleção). */
export const listModels = () => Object.keys(REGISTRY);
