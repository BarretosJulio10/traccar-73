-- Migration: OneSignal push notification system
-- Substitui gradualmente o sistema VAPID (push_subscriptions) pelo OneSignal.
-- O OneSignal gerencia suas próprias subscriptions externamente.
-- Esta migration registra a mudança e garante que as tabelas de suporte estão corretas.

-- ── 1. push_subscriptions: garantir índice para cleanup de subs expiradas ────
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_updated
  ON push_subscriptions(updated_at);

-- ── 2. Função utilitária: limpar subscriptions antigas (>90 dias sem renovar) ──
-- Chamada manualmente ou via pg_cron se necessário
CREATE OR REPLACE FUNCTION cleanup_expired_push_subscriptions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM push_subscriptions
  WHERE updated_at < now() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- ── 3. Comentários documentando a arquitetura de notificações ──────────────
COMMENT ON TABLE push_subscriptions IS
  'Subscriptions Web Push VAPID (sistema legado — mantido para compatibilidade durante migração para OneSignal)';

-- ── 4. Nota: colunas whatsapp_number/whatsapp_message na tabela tenants ──────
-- Não foram dropadas para preservar dados existentes.
-- Podem ser removidas manualmente após confirmar que nenhum tenant usa mais:
--   ALTER TABLE tenants DROP COLUMN IF EXISTS whatsapp_number;
--   ALTER TABLE tenants DROP COLUMN IF EXISTS whatsapp_message;
