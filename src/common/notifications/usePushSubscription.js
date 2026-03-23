/**
 * usePushSubscription — Web Push API (VAPID)
 *
 * Gerencia a subscription do navegador ao servidor de push.
 * Salva a subscription no Supabase para que o backend possa enviar
 * notificações mesmo com o app completamente fechado.
 *
 * SETUP:
 *   1. Gere as chaves VAPID: npx web-push generate-vapid-keys
 *   2. Adicione no .env: VITE_VAPID_PUBLIC_KEY=<sua_chave_publica>
 *   3. Adicione a chave privada como segredo no Supabase Edge Functions
 *   4. Crie a tabela no Supabase:
 *      CREATE TABLE push_subscriptions (
 *        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *        tenant_id text,
 *        user_id text,
 *        endpoint text UNIQUE NOT NULL,
 *        p256dh text NOT NULL,
 *        auth text NOT NULL,
 *        user_agent text,
 *        created_at timestamptz DEFAULT now(),
 *        updated_at timestamptz DEFAULT now()
 *      );
 */

import { useEffect, useCallback, useState } from 'react';
import { useSelector } from 'react-redux';
import { supabase } from '../../integrations/supabase/client';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

/** Converte chave VAPID base64url para Uint8Array (exigido pela PushManager API) */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const output = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    output[i] = rawData.charCodeAt(i);
  }
  return output;
}

const usePushSubscription = () => {
  const user = useSelector((state) => state.session.user);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState(null);

  const isSupported =
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    !!VAPID_PUBLIC_KEY;

  // Verifica se já há uma subscription ativa ao montar
  useEffect(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscription(sub);
        setIsSubscribed(!!sub);
      });
    });
  }, [isSupported]);

  // Escuta mensagens do SW para resubscription automática
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const handleMessage = (event) => {
      if (event.data?.type === 'PUSH_SUBSCRIPTION_CHANGED') {
        const newSub = event.data.subscription;
        setSubscription(newSub);
        setIsSubscribed(!!newSub);
        if (newSub) saveToServer(newSub);
      }
    };
    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => navigator.serviceWorker.removeEventListener('message', handleMessage);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveToServer = useCallback(
    async (sub) => {
      if (!sub) return;
      const json = typeof sub.toJSON === 'function' ? sub.toJSON() : sub;
      try {
        await supabase.from('push_subscriptions').upsert(
          {
            endpoint: json.endpoint,
            p256dh: json.keys?.p256dh ?? '',
            auth: json.keys?.auth ?? '',
            user_id: user?.id ? String(user.id) : null,
            tenant_id: localStorage.getItem('tenantSlug') ?? null,
            user_agent: navigator.userAgent,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'endpoint' }
        );
      } catch (err) {
        console.error('[PushSubscription] Falha ao salvar no servidor:', err);
      }
    },
    [user]
  );

  /** Inscreve o navegador no serviço de push e salva no Supabase */
  const subscribe = useCallback(async () => {
    if (!isSupported) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      setSubscription(sub);
      setIsSubscribed(true);
      await saveToServer(sub);
      return true;
    } catch (err) {
      console.error('[PushSubscription] Falha ao inscrever:', err);
      return false;
    }
  }, [isSupported, saveToServer]);

  /** Remove a subscription do navegador e do Supabase */
  const unsubscribe = useCallback(async () => {
    if (!subscription) return;
    try {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint);
      setSubscription(null);
      setIsSubscribed(false);
    } catch (err) {
      console.error('[PushSubscription] Falha ao cancelar inscrição:', err);
    }
  }, [subscription]);

  return { isSubscribed, subscription, subscribe, unsubscribe, isSupported };
};

export default usePushSubscription;
