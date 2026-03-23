-- Tabela de cursor por tenant para o poller de eventos Traccar
-- Evita reprocessar eventos já enviados via push

CREATE TABLE IF NOT EXISTS tenant_event_cursors (
  tenant_id   uuid PRIMARY KEY REFERENCES tenants(id) ON DELETE CASCADE,
  last_polled_at timestamptz NOT NULL DEFAULT (now() - interval '5 minutes'),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- RLS: somente service_role acessa (uso exclusivo da Edge Function)
ALTER TABLE tenant_event_cursors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_event_cursors_service_only"
  ON tenant_event_cursors
  FOR ALL
  USING (false)
  WITH CHECK (false);
