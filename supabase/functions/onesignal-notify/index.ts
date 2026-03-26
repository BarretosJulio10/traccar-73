/**
 * Edge Function: onesignal-notify
 *
 * Envia notificação push via OneSignal REST API.
 * Substitui gradualmente o `send-push` baseado em VAPID.
 *
 * Segredos necessários no Supabase (Dashboard → Edge Functions → Secrets):
 *   ONESIGNAL_APP_ID       — App ID do painel OneSignal
 *   ONESIGNAL_REST_API_KEY — REST API Key (Settings → Keys & IDs → REST API Key)
 *
 * Isolamento multi-tenant:
 *   Filtra destinatários via tag `tenant_id` cadastrada no perfil do usuário OneSignal.
 *   Apenas usuários com `tenant_id = <valor>` recebem a notificação.
 *
 * Deduplicação:
 *   Usa `idempotency_key = "${tenant_id}-${event_id}"`.
 *   OneSignal rejeita envios duplicados dentro de uma janela de 10 minutos.
 *   Evita N notificações quando N usuários do mesmo tenant estão online simultaneamente.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ONESIGNAL_APP_ID = Deno.env.get('ONESIGNAL_APP_ID') ?? '';
const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY') ?? '';
const ONESIGNAL_API = 'https://onesignal.com/api/v1/notifications';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Preflight CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    // Valida configuração
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_REST_API_KEY) {
      console.error('[onesignal-notify] Segredos não configurados.');
      return new Response(
        JSON.stringify({ error: 'OneSignal não configurado no servidor.' }),
        { status: 503, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // Parse payload
    const {
      tenant_id,
      event_id,
      title,
      body,
      icon,
      url = '/',
      data = {},
      require_interaction = false,
    } = await req.json();

    // Valida campos obrigatórios
    if (!tenant_id || !title || !body) {
      return new Response(
        JSON.stringify({ error: 'Campos obrigatórios ausentes: tenant_id, title, body' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // Monta payload para OneSignal REST API v1
    const payload: Record<string, unknown> = {
      app_id: ONESIGNAL_APP_ID,

      // ── Isolamento multi-tenant ──────────────────────────────────────────
      // Entrega APENAS para usuários com a tag tenant_id = <tenant_id>
      filters: [
        { field: 'tag', key: 'tenant_id', relation: '=', value: tenant_id },
      ],

      // ── Conteúdo ─────────────────────────────────────────────────────────
      headings: { en: title, pt: title },
      contents: { en: body, pt: body },

      // ── Ação ao clicar ───────────────────────────────────────────────────
      url,

      // ── Dados extras (disponíveis no handler da notificação) ─────────────
      data: { ...data, tenant_id },

      // ── Prioridade ───────────────────────────────────────────────────────
      // 10 = urgente (SOS, alarme), 6 = normal (ignição, cerca)
      priority: require_interaction ? 10 : 6,

      // ── Visual Android ───────────────────────────────────────────────────
      android_accent_color: 'FF0D9488', // Teal da identidade visual

      // ── Badge iOS ────────────────────────────────────────────────────────
      ios_badgeType: 'Increase',
      ios_badgeCount: 1,

      // ── Deduplicação ─────────────────────────────────────────────────────
      // Previne N envios idênticos quando N usuários detectam o mesmo evento
    };

    // Ícone (web + Firefox)
    if (icon) {
      payload.chrome_web_icon = icon;
      payload.firefox_icon = icon;
    }

    // Idempotency key: evita duplicatas por 10 minutos
    if (event_id) {
      payload.idempotency_key = `${tenant_id}-${event_id}`;
    }

    // ── Chama OneSignal REST API ──────────────────────────────────────────
    const response = await fetch(ONESIGNAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${ONESIGNAL_REST_API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      console.error('[onesignal-notify] Erro da API:', JSON.stringify(result));
      return new Response(
        JSON.stringify({ error: result }),
        { status: response.status, headers: { ...CORS, 'Content-Type': 'application/json' } },
      );
    }

    // recipients = 0 significa que ninguém estava inscrito com esse tenant_id (normal em dev)
    const recipients = result.recipients as number ?? 0;
    console.log(`[onesignal-notify] Enviado | tenant=${tenant_id} | event=${event_id} | recipients=${recipients}`);

    return new Response(
      JSON.stringify({ success: true, notification_id: result.id, recipients }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  } catch (err) {
    console.error('[onesignal-notify] Exceção:', err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } },
    );
  }
});
