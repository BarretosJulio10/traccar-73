-- Adiciona coluna ui_model à tabela tenants
-- Controla qual modelo de interface será carregado pelo ModelRouter
-- Valores válidos: 'default' | 'compact' | 'fleet'

ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS ui_model TEXT NOT NULL DEFAULT 'default';

-- Comentário descritivo
COMMENT ON COLUMN public.tenants.ui_model IS
  'Modelo de UI a ser carregado pelo ModelRouter. Valores: default, compact, fleet.';
