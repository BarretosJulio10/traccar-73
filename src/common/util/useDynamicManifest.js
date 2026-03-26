/**
 * useDynamicManifest — Atualiza o Web App Manifest com dados do tenant.
 *
 * Troca o <link rel="manifest"> por um blob URL contendo o manifest
 * personalizado com nome, ícone e start_url do tenant.
 *
 * Funciona bem no Android Chrome (ícone e nome do app).
 * No iOS Safari: atualiza também o apple-touch-icon (best effort).
 * Quem já instalou o PWA precisa desinstalar e reinstalar para ver a mudança.
 */

import { useEffect } from 'react';

const BASE_MANIFEST = {
  id: '/',
  scope: '/',
  theme_color: '#0d9488',
  background_color: '#1a1b1e',
  display: 'standalone',
  orientation: 'portrait',
  lang: 'pt-BR',
  dir: 'ltr',
  categories: ['navigation', 'utilities'],
};

const useDynamicManifest = (tenant) => {
  useEffect(() => {
    if (!tenant?.logo_url) return;

    const name = tenant.company_name || 'HyperTraccar';
    const shortName = name.length > 12 ? `${name.slice(0, 11)}…` : name;
    const slug = tenant.slug || '';

    const manifest = {
      ...BASE_MANIFEST,
      name,
      short_name: shortName,
      description: `Rastreamento veicular - ${name}`,
      // start_url com tenant garante que o PWA abre direto no tenant correto
      start_url: slug ? `/?source=pwa&tenant=${encodeURIComponent(slug)}` : '/?source=pwa',
      icons: [
        { src: tenant.logo_url, sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: tenant.logo_url, sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
      ],
      screenshots: [
        {
          src: tenant.logo_url,
          sizes: '512x512',
          type: 'image/png',
          form_factor: 'narrow',
          label: `${name} - Rastreamento GPS`,
        },
      ],
    };

    const blob = new Blob([JSON.stringify(manifest)], { type: 'application/manifest+json' });
    const blobUrl = URL.createObjectURL(blob);

    // Atualiza <link rel="manifest">
    const manifestLink = document.querySelector('link[rel="manifest"]');
    if (manifestLink) {
      const prev = manifestLink.getAttribute('href');
      manifestLink.setAttribute('href', blobUrl);
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
    }

    // Atualiza apple-touch-icon (iOS Safari — best effort)
    const appleLink = document.querySelector('link[rel="apple-touch-icon"]');
    if (appleLink) appleLink.setAttribute('href', tenant.logo_url);

    return () => URL.revokeObjectURL(blobUrl);
  }, [tenant?.logo_url, tenant?.company_name, tenant?.slug]);
};

export default useDynamicManifest;
