/**
 * Supabase Edge Function: send-push
 *
 * Envia Web Push para um usuário/tenant específico.
 * Chamada pelo sistema quando um evento Traccar ocorre.
 *
 * Secrets necessários (Supabase Dashboard > Edge Functions > Secrets):
 *   VAPID_PRIVATE_KEY  — chave privada VAPID
 *   VAPID_PUBLIC_KEY   — chave pública VAPID (mesma do .env frontend)
 *   VAPID_SUBJECT      — mailto:seu@email.com
 *
 * Body esperado (POST):
 *   {
 *     "tenant_id": "mabtracker",
 *     "user_id": "123",          // opcional — omitir para enviar para todos do tenant
 *     "title": "Alarme: SOS",
 *     "body": "Veículo ABC-1234 acionou SOS",
 *     "icon": "/pwa-192x192.png",
 *     "tag": "event-123",
 *     "url": "/app",
 *     "data": {}
 *   }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import webpush from 'npm:web-push@3.6.7';

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_SUBJECT = Deno.env.get('VAPID_SUBJECT') ?? 'mailto:admin@hypertraccar.com';

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const body = await req.json();
    const { tenant_id, user_id, title, body: msgBody, icon, tag, url, data } = body;

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'tenant_id is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Busca subscriptions do tenant/usuário
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let query = supabase.from('push_subscriptions').select('*').eq('tenant_id', tenant_id);
    if (user_id) query = query.eq('user_id', String(user_id));

    const { data: subscriptions, error } = await query;
    if (error) throw error;
    if (!subscriptions?.length) {
      return new Response(JSON.stringify({ sent: 0, message: 'No subscriptions found' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Payload da notificação
    const payload = JSON.stringify({
      title: title ?? 'HyperTraccar',
      body: msgBody ?? '',
      icon: icon ?? '/pwa-192x192.png',
      tag: tag ?? `push-${Date.now()}`,
      url: url ?? '/',
      data: data ?? {},
    });

    // Envia para todos os dispositivos encontrados
    const results = await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload
        ).catch(async (err) => {
          // Remove subscriptions expiradas (410 Gone)
          if (err.statusCode === 410 || err.statusCode === 404) {
            await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          }
          throw err;
        })
      )
    );

    const sent = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - sent;

    return new Response(JSON.stringify({ sent, failed, total: results.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  } catch (err) {
    console.error('[send-push] Error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
