// ─── Demo Service — fonte canônica do modo demo ──────────────────────────────
// Centraliza: ativar, desativar, verificar e limpar o modo demo.
// Elimina a necessidade de checar sessionStorage diretamente em cada arquivo.

import { SESSION } from '../config/storageKeys';

const DEMO_TOKEN_PREFIX = 'demo_';

export const demoService = {
  /**
   * Verifica se o modo demo está ativo.
   * Requer um token gerado por enable() — não aceita 'true' literal.
   * Isso impede ativação trivial via console: sessionStorage.setItem('demoMode', 'true').
   */
  isActive: () => {
    const val = window.sessionStorage.getItem(SESSION.DEMO_MODE);
    return val !== null && val.startsWith(DEMO_TOKEN_PREFIX);
  },

  /** Ativa o modo demo com token opaco (não trivialmente adivinhável). */
  enable: () => {
    const token = `${DEMO_TOKEN_PREFIX}${Date.now()}_${Math.random().toString(36).slice(2)}`;
    window.sessionStorage.setItem(SESSION.DEMO_MODE, token);
  },

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
