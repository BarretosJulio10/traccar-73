// ─── Demo Service — fonte canônica do modo demo ──────────────────────────────
// Centraliza: ativar, desativar, verificar e limpar o modo demo.
// Elimina a necessidade de checar sessionStorage diretamente em cada arquivo.

import { SESSION } from '../config/storageKeys';

export const demoService = {
  /** Verifica se o modo demo está ativo. */
  isActive: () => window.sessionStorage.getItem(SESSION.DEMO_MODE) === 'true',

  /** Ativa o modo demo. */
  enable: () => window.sessionStorage.setItem(SESSION.DEMO_MODE, 'true'),

  /** Desativa o modo demo. */
  disable: () => window.sessionStorage.removeItem(SESSION.DEMO_MODE),

  /** Simula delay de rede para operações demo. */
  delay: (ms = 700) => new Promise((r) => setTimeout(r, ms)),

  /**
   * Executa uma função real ou retorna um valor mock, dependendo do modo.
   * @param {Function} realFn    — chamada quando demo está desativado
   * @param {Function} mockFn   — chamada quando demo está ativo
   */
  run: async (realFn, mockFn) => {
    if (demoService.isActive()) {
      return mockFn();
    }
    return realFn();
  },
};
