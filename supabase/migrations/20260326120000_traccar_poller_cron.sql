-- Migration: Agendamento do cron job para o traccar-events-poller
--
-- PASSOS ANTES DE EXECUTAR:
--
-- 1. No Supabase Dashboard → Edge Functions → traccar-events-poller → Secrets, adicione:
--      APP_URL          = https://traccar-73.vercel.app   (URL do seu frontend)
--      CRON_SECRET      = qualquer_string_secreta         (ex: openssl rand -hex 16)
--      ONESIGNAL_APP_ID = ...
--      ONESIGNAL_REST_API_KEY = ...
--
-- 2. No SQL Editor, defina o mesmo CRON_SECRET como parâmetro do banco:
--      ALTER DATABASE postgres SET app.cron_secret = 'mesma_string_que_acima';
--
-- 3. Certifique-se que as extensões pg_cron e pg_net estão ativas:
--      Dashboard → Database → Extensions → buscar "cron" e "http" / "net"
--
-- 4. Execute este script no SQL Editor.
--
-- Verificar se funcionou: SELECT * FROM cron.job WHERE jobname = 'poll-traccar-events';

-- Remove agendamento anterior se existir (idempotente)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'poll-traccar-events') THEN
    PERFORM cron.unschedule('poll-traccar-events');
  END IF;
END $$;

-- Agenda o poller para rodar a cada minuto
SELECT cron.schedule(
  'poll-traccar-events',
  '* * * * *',
  $$
  SELECT net.http_post(
    url     := 'https://foifugnuaehjtjftpkrk.functions.supabase.co/traccar-events-poller',
    headers := jsonb_build_object(
                 'Content-Type', 'application/json',
                 'x-cron-secret', current_setting('app.cron_secret', true)
               ),
    body    := '{}'::jsonb
  ) AS request_id
  $$
);
