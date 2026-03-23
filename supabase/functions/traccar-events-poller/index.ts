/**
 * Supabase Edge Function: traccar-events-poller
 *
 * Chamada a cada minuto pelo pg_cron.
 * Para cada tenant ativo com sessão Traccar válida:
 *   1. Busca eventos novos desde o último poll
 *   2. Para eventos que qualificam notificação, chama send-push
 *   3. Atualiza o cursor do tenant
 *
 * Secrets necessários:
 *   CRON_SECRET         — segredo compartilhado com o pg_cron job
 *   SUPABASE_URL        — injetado automaticamente pelo Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — injetado automaticamente pelo Supabase
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const CRON_SECRET = Deno.env.get('CRON_SECRET') ?? '';

// Tipos de evento que geram notificação push
const NOTIFIABLE_EVENTS = new Set([
  'deviceOnline', 'deviceOffline', 'deviceInactive',
  'deviceMoving', 'deviceStopped', 'deviceOverspeed',
  'deviceFuelDrop', 'deviceFuelIncrease', 'commandResult',
  'geofenceEnter', 'geofenceExit', 'alarm',
  'ignitionOn', 'ignitionOff', 'maintenance',
  'textMessage', 'driverChanged', 'media', 'queuedCommandSent',
]);

const EVENT_TITLES: Record<string, string> = {
  deviceOnline:       '🟢 Online',
  deviceOffline:      '🔴 Offline',
  deviceInactive:     '💤 Inativo',
  deviceMoving:       '🚗 Em movimento',
  deviceStopped:      '🅿️ Parado',
  deviceOverspeed:    '⚡ Excesso de velocidade',
  deviceFuelDrop:     '⛽ Queda de combustível',
  deviceFuelIncrease: '⛽ Aumento de combustível',
  geofenceEnter:      '📍 Entrou na geocerca',
  geofenceExit:       '📍 Saiu da geocerca',
  alarm:              '🚨 Alarme',
  ignitionOn:         '🔑 Ignição ligada',
  ignitionOff:        '🔑 Ignição desligada',
  maintenance:        '🔧 Manutenção',
  textMessage:        '💬 Mensagem',
  driverChanged:      '👤 Motorista alterado',
  commandResult:      '📟 Resultado de comando',
};

function formatEvent(event: any, deviceName: string): { title: string; body: string } {
  const title = EVENT_TITLES[event.type] ?? `🔔 ${event.type}`;
  let body = deviceName;
  if (event.type === 'alarm' && event.attributes?.alarm) {
    body += ` — ${event.attributes.alarm}`;
  }
  if (event.type === 'deviceOverspeed' && event.attributes?.speed) {
    body += ` — ${Math.round(event.attributes.speed * 1.852)} km/h`;
  }
  if (event.attributes?.message) {
    body += ` — ${event.attributes.message}`;
  }
  return { title, body };
}

serve(async (req) => {
  // Valida segredo do cron
  const secret = req.headers.get('x-cron-secret');
  if (!secret || secret !== CRON_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = new Date().toISOString();
  const results: Record<string, any> = {};

  // Busca todos os tenants ativos
  const { data: tenants, error: tenantsError } = await supabase
    .from('tenants')
    .select('id, slug, traccar_url')
    .not('subscription_status', 'in', '("suspended","cancelled")')
    .not('traccar_url', 'is', null);

  if (tenantsError) {
    console.error('[events-poller] Failed to load tenants:', tenantsError);
    return new Response(JSON.stringify({ error: tenantsError.message }), { status: 500 });
  }

  for (const tenant of tenants ?? []) {
    try {
      // Busca a sessão mais recente válida para este tenant
      const { data: session } = await supabase
        .from('traccar_sessions')
        .select('session_cookie')
        .eq('tenant_id', tenant.id)
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!session?.session_cookie) {
        results[tenant.slug] = { skipped: 'no_valid_session' };
        continue;
      }

      // Busca ou inicializa cursor
      const { data: cursor } = await supabase
        .from('tenant_event_cursors')
        .select('last_polled_at')
        .eq('tenant_id', tenant.id)
        .maybeSingle();

      const from = cursor?.last_polled_at ?? new Date(Date.now() - 5 * 60_000).toISOString();

      // Atualiza cursor imediatamente (evita reprocessar se a função travar)
      await supabase.from('tenant_event_cursors').upsert({
        tenant_id: tenant.id,
        last_polled_at: now,
        updated_at: now,
      });

      // Chama Traccar diretamente com a sessão armazenada
      const traccarUrl = tenant.traccar_url.replace(/\/$/, '');
      const params = new URLSearchParams({ from, to: now });

      const eventsRes = await fetch(`${traccarUrl}/api/events?${params}`, {
        headers: { Cookie: session.session_cookie },
      });

      if (!eventsRes.ok) {
        // Sessão pode ter expirado no Traccar — limpa para forçar re-login do usuário
        if (eventsRes.status === 401) {
          await supabase
            .from('traccar_sessions')
            .delete()
            .eq('tenant_id', tenant.id)
            .eq('session_cookie', session.session_cookie);
        }
        results[tenant.slug] = { skipped: `traccar_${eventsRes.status}` };
        continue;
      }

      const events: any[] = await eventsRes.json();
      const qualifying = events.filter((e) => NOTIFIABLE_EVENTS.has(e.type));

      if (!qualifying.length) {
        results[tenant.slug] = { sent: 0 };
        continue;
      }

      // Busca nomes dos devices uma única vez
      const devicesRes = await fetch(`${traccarUrl}/api/devices`, {
        headers: { Cookie: session.session_cookie },
      });
      const devices: any[] = devicesRes.ok ? await devicesRes.json() : [];
      const deviceMap = Object.fromEntries(devices.map((d) => [d.id, d.name]));

      let sent = 0;
      for (const event of qualifying) {
        const deviceName = deviceMap[event.deviceId] ?? `ID ${event.deviceId}`;
        const { title, body } = formatEvent(event, deviceName);

        const pushRes = await fetch(`${SUPABASE_URL}/functions/v1/send-push`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            tenant_id: tenant.slug,
            title,
            body,
            icon: '/pwa-192x192.png',
            tag: `traccar-event-${event.id}`,
            url: '/app',
            data: { eventId: event.id, deviceId: event.deviceId, type: event.type },
          }),
        });

        if (pushRes.ok) sent++;
      }

      results[tenant.slug] = { sent, total: qualifying.length };
    } catch (err) {
      console.error(`[events-poller] Error for tenant ${tenant.slug}:`, err);
      results[tenant.slug] = { error: String(err) };
    }
  }

  console.log('[events-poller] Done:', JSON.stringify(results));
  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
