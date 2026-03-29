/**
 * branding.js — Utilitários para atualizar a identidade visual dinamicamente.
 */

/**
 * Atualiza o favicon da página.
 * @param {string} url - URL da imagem do favicon.
 */
export const updateFavicon = (url) => {
  if (!url) return;
  let link = document.querySelector('link[rel="icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'icon';
    document.head.appendChild(link);
  }
  link.href = url;
};

/**
 * Atualiza o ícone do Apple Touch (iOS).
 * @param {string} url - URL da imagem do ícone.
 */
export const updateAppleTouchIcon = (url) => {
  if (!url) return;
  let link = document.querySelector('link[rel="apple-touch-icon"]');
  if (!link) {
    link = document.createElement('link');
    link.rel = 'apple-touch-icon';
    document.head.appendChild(link);
  }
  link.href = url;
};

/**
 * Atualiza o título da página.
 * @param {string} title - Novo título.
 */
export const updatePageTitle = (title) => {
  if (!title) return;
  document.title = title;
};

/**
 * Aplica toda a identidade visual de uma vez.
 * @param {Object} tenant - Objeto do tenant contendo logo_url e company_name.
 */
export const applyBranding = (tenant) => {
  if (!tenant) return;
  
  if (tenant.logo_url) {
    updateFavicon(tenant.logo_url);
    updateAppleTouchIcon(tenant.logo_url);
  }
  
  if (tenant.company_name) {
    updatePageTitle(tenant.company_name);
  }
};
