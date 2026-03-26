/**
 * OneSignal Service Worker — HyperTraccar
 *
 * Registrado pelo OneSignal SDK com scope /push/ (independente do Workbox SW em /).
 * Gerencia APENAS as push subscriptions do OneSignal — sem conflito com sw.js.
 *
 * NÃO modificar ou importar neste arquivo manualmente.
 * NÃO adicionar ao precache do Workbox (veja vite.config.js globIgnores).
 */
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');
