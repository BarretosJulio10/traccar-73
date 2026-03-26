/**
 * useOneSignal — Sistema de push via OneSignal (migração paralela)
 *
 *
 * Requisitos para ativar:
 *   .env:  VITE_ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *   Supabase Edge Function secrets:
 *     ONESIGNAL_APP_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 *     ONESIGNAL_REST_API_KEY=os_v2_...
 *
 * Se VITE_ONESIGNAL_APP_ID não estiver definido, o hook é no-op — nenhum erro.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../integrations/supabase/client';
import { DEFAULT_TENANT_SLUG } from '../util/constants';
import { formatEventNotification, shouldNotify } from './notificationEvents';
import { useTranslation } from '../components/LocalizationProvider';
import { useTenant } from '../components/TenantProvider';

// ─── Singleton: inicializado uma vez por carregamento de página ──────────────
let _osPromise = null;

const _initOneSignal = () => {
  if (_osPromise) return _osPromise;

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;
  if (!appId) {
    _osPromise = Promise.resolve(null);
    return _osPromise;
  }

  _osPromise = import('react-onesignal')
    .then(async ({ default: OneSignal }) => {
      await OneSignal.init({
        appId,
        // Em dev local permite notificações sem HTTPS
        allowLocalhostAsSecureOrigin: import.meta.env.DEV === true,
        // SW dedicado ao OneSignal em scope /push/ — sem conflito com Workbox em /
        serviceWorkerPath: '/OneSignalSDKWorker.js',
        serviceWorkerParam: { scope: '/push/' },
        // Botão flutuante desativado — usamos nossa própria UI
        notifyButton: { enable: false },
        // Slidedown manual — ativado só quando usuário clica em "Ativar"
        promptOptions: {
          slidedown: {
            prompts: [{
              type: 'push',
              autoPrompt: false,
              text: {
                actionMessage: 'Ative para receber alertas de seus veículos mesmo com o app fechado.',
                acceptButtonText: 'Ativar',
                cancelButtonText: 'Depois',
              },
            }],
          },
        },
      });
      return OneSignal;
    })
    .catch((err) => {
      console.warn('[OneSignal] Falha na inicialização:', err);
      _osPromise = null; // Permite retry na próxima montagem
      return null;
    });

  return _osPromise;
};

// ─── Hook ────────────────────────────────────────────────────────────────────
const useOneSignal = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const osRef = useRef(null);
  const userSyncedRef = useRef(false);

  const t = useTranslation();
  const devices = useSelector((state) => state.devices.items);
  const userId = useSelector((state) => state.session.user?.id);
  const { tenant } = useTenant() || {};

  const appId = import.meta.env.VITE_ONESIGNAL_APP_ID;

  // ── Inicialização ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!appId) return;

    _initOneSignal().then((os) => {
      if (!os) return;
      osRef.current = os;
      setIsInitialized(true);

      // Estado inicial de subscription
      setIsSubscribed(!!os.User?.PushSubscription?.optedIn);

      // Reage a mudanças de subscription (opt-in/opt-out)
      os.User?.PushSubscription?.addEventListener('change', (ev) => {
        setIsSubscribed(!!ev?.current?.optedIn);
      });
    });
  }, [appId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auto-inscrição: se permissão já concedida, inscreve sem precisar clicar ─
  // Resolve o caso de usuários que já tinham permissão antes do OneSignal ser adicionado.
  useEffect(() => {
    if (!osRef.current || !isInitialized) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    if (osRef.current.User?.PushSubscription?.optedIn) return; // já inscrito

    const tenantSlug = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
    osRef.current.User.PushSubscription.optIn()
      .then(() => osRef.current.User.addTag('tenant_id', tenantSlug))
      .then(() => setIsSubscribed(true))
      .catch(() => {}); // silencioso — não bloqueia o app
  }, [isInitialized]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sincronização de tags após autenticação ────────────────────────────────
  // Garante que o usuário tem tenant_id e user_id para filtragem de notificações
  useEffect(() => {
    if (!osRef.current || !userId || !isInitialized) return;
    if (userSyncedRef.current) return; // Já sincronizado nesta sessão

    userSyncedRef.current = true;
    const tenantSlug = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;

    Promise.all([
      osRef.current.User.addTags({
        tenant_id: tenantSlug,
        user_id: String(userId),
      }),
      // External ID = chave única por usuário por tenant
      osRef.current.login(`${tenantSlug}_${userId}`),
    ]).catch(() => {
      userSyncedRef.current = false; // Permite retry
    });
  }, [userId, isInitialized]);

  // ── Inscrição explícita (chamada pela InstallPage / Settings) ──────────────
  const subscribe = useCallback(async (tenantSlug) => {
    if (!osRef.current) return false;
    try {
      const granted = await osRef.current.Notifications.requestPermission();
      if (!granted) return false;

      await osRef.current.User.PushSubscription.optIn();

      const slug = tenantSlug || localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
      await osRef.current.User.addTag('tenant_id', slug);

      if (userId) {
        await osRef.current.User.addTag('user_id', String(userId));
        await osRef.current.login(`${slug}_${userId}`);
        userSyncedRef.current = true;
      }

      setIsSubscribed(true);
      return true;
    } catch (err) {
      console.warn('[OneSignal] Falha ao inscrever:', err);
      return false;
    }
  }, [userId]);

  // ── Cancelar inscrição ─────────────────────────────────────────────────────
  const unsubscribe = useCallback(async () => {
    if (!osRef.current) return;
    try {
      await osRef.current.User.PushSubscription.optOut();
      setIsSubscribed(false);
    } catch (err) {
      console.warn('[OneSignal] Falha ao cancelar inscrição:', err);
    }
  }, []);

  // ── Enviar notificação de evento via Edge Function ─────────────────────────
  // Usa idempotency_key (tenant_id + event_id) para evitar duplicatas quando
  // múltiplos usuários estão online e acionam a Edge Function simultaneamente.
  const sendEventPush = useCallback((event) => {
    if (!appId) return; // OneSignal não configurado — no-op
    if (!shouldNotify(event.type)) return;

    const notification = formatEventNotification(event, devices, t);
    if (!notification) return;

    const tenantId = localStorage.getItem('tenantSlug') || DEFAULT_TENANT_SLUG;
    const iconUrl = tenant?.logo_url || `${window.location.origin}/pwa-192x192.png`;

    supabase.functions.invoke('onesignal-notify', {
      body: {
        tenant_id: tenantId,
        event_id: String(event.id),
        title: notification.title,
        body: notification.body,
        icon: iconUrl,
        url: `${window.location.origin}/app`,
        data: notification.data,
        require_interaction: notification.requireInteraction ?? false,
      },
    }).catch(() => {}); // Silencioso — notificação local já foi exibida
  }, [appId, devices, t, tenant]);

  return {
    isInitialized,
    isSubscribed,
    subscribe,
    unsubscribe,
    sendEventPush,
  };
};

export default useOneSignal;
