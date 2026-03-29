import fetchOrThrow from '../../common/util/fetchOrThrow';
import { apiUrl } from '../../common/util/apiUrl';
import { DEFAULT_TENANT_SLUG } from '../../common/util/constants';

/**
 * Adapter para abstrair a comunicação com a Sessão e Atributos do Traccar.
 * Segue o Pilar 2.1 (Desacoplamento Absoluto) da AI_MEMORY.md.
 */
export const traccarSessionAdapter = {
  /**
   * Verifica a sessão atual no servidor.
   * Não usa fetchOrThrow aqui para permitir tratamento manual de 401/404 no App.jsx sem redirecionamento automático.
   */
  fetchSession: async () => {
    const tenantSlug = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
    const email = sessionStorage.getItem('traccarEmail') || localStorage.getItem('traccarEmail') || '';
    
    return fetch(apiUrl('/api/session'), {
      headers: {
        'x-tenant-slug': tenantSlug,
        'x-traccar-email': email,
      },
    });
  },

  /**
   * Busca atributos calculados.
   */
  fetchComputedAttributes: async () => {
    const response = await fetchOrThrow('/api/attributes/computed?all=true');
    return response.json();
  },

  /**
   * Realiza login via token (SaaS link).
   */
  loginWithToken: async (token) => {
    const response = await fetchOrThrow(`/api/session?token=${encodeURIComponent(token)}`);
    return response.json();
  },
};
