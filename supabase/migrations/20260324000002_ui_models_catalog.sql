-- Catálogo de modelos de interface disponíveis no SaaS
-- Cada linha representa um frontend model disponível para os tenants escolherem
-- O campo ui_model em tenants referencia o id desta tabela

CREATE TABLE public.ui_models (
  id           TEXT PRIMARY KEY,                   -- 'default' | 'compact' | 'fleet'
  name         TEXT NOT NULL,                      -- Nome exibido no painel admin
  description  TEXT,                               -- Descrição para o tenant
  preview_url  TEXT,                               -- URL de screenshot/preview
  status       TEXT NOT NULL DEFAULT 'active',     -- 'active' | 'coming_soon' | 'deprecated'
  sort_order   INTEGER NOT NULL DEFAULT 0,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS: leitura pública (qualquer tenant autenticado pode ver os modelos disponíveis)
ALTER TABLE public.ui_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "UI models are publicly readable"
  ON public.ui_models FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only service role can modify ui_models"
  ON public.ui_models FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed: modelos disponíveis
INSERT INTO public.ui_models (id, name, description, status, sort_order) VALUES
  (
    'default',
    'Interface Padrão',
    'Interface completa com mapa ao centro, sidebar de veículos, painel de detalhes e controles táticos. Recomendada para a maioria das empresas.',
    'active',
    1
  ),
  (
    'compact',
    'Interface Compacta',
    'Layout simplificado para operadores que precisam de uma visão rápida da frota sem os detalhes avançados. Ideal para telas menores.',
    'coming_soon',
    2
  ),
  (
    'fleet',
    'Interface Fleet',
    'Dashboard otimizado para grandes frotas com visualização em grade, indicadores de performance e alertas em destaque.',
    'coming_soon',
    3
  );

-- FK suave: garante que ui_model do tenant seja um valor válido
-- (não usa FK real para não bloquear inserções antigas com 'default' antes da migration)
COMMENT ON TABLE public.ui_models IS
  'Catálogo de modelos de frontend disponíveis. O campo tenants.ui_model referencia o id desta tabela.';
