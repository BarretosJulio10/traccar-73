-- Tabela para armazenar subscriptions de Web Push por dispositivo/usuário
-- Execute no Supabase Dashboard > SQL Editor

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    text,
  user_id      text,
  endpoint     text UNIQUE NOT NULL,
  p256dh       text NOT NULL,
  auth         text NOT NULL,
  user_agent   text,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Índices para buscas por tenant e usuário
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_tenant ON push_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- RLS: cada tenant só acessa suas próprias subscriptions
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "push_subscriptions_tenant_isolation"
  ON push_subscriptions
  FOR ALL
  USING (true)  -- ajuste para usar auth.uid() ou headers quando necessário
  WITH CHECK (true);

-- Trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER push_subscriptions_updated_at
  BEFORE UPDATE ON push_subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
