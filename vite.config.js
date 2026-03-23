import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import svgr from 'vite-plugin-svgr';
import { VitePWA } from 'vite-plugin-pwa';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(() => ({
  server: {
    port: 3000,
    proxy: {
      '/api/socket': {
        target: 'wss://web.mabtracker.com.br',
        changeOrigin: true,
        ws: true,
      },
      '/api': {
        target: 'https://web.mabtracker.com.br',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
  plugins: [
    tailwindcss(),
    svgr(),
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'maskable-icon-512x512.png'],
      injectManifest: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,woff,woff2,mp3}'],
      },
      manifest: {
        id: '/',
        scope: '/',
        short_name: 'HyperTraccar',
        name: 'HyperTraccar - Rastreador GPS',
        description: 'Plataforma de rastreamento veicular em tempo real',
        theme_color: '#0d9488',
        background_color: '#1a1b1e',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/?source=pwa',
        lang: 'pt-BR',
        dir: 'ltr',
        categories: ['navigation', 'utilities'],
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'HyperTraccar - Rastreamento GPS',
          },
        ],
      },
    }),
    viteStaticCopy({
      targets: [
        { src: 'node_modules/@mapbox/mapbox-gl-rtl-text/dist/mapbox-gl-rtl-text.js', dest: '' },
      ],
    }),
  ],
}));
