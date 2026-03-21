
-- Tabela de tenants (empresas clientes do SaaS)
CREATE TABLE public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  company_name TEXT NOT NULL,
  traccar_url TEXT NOT NULL,
  custom_domain TEXT UNIQUE,
  logo_url TEXT,
  color_primary TEXT DEFAULT '#1a73e8',
  color_secondary TEXT DEFAULT '#ffffff',
  whatsapp_number TEXT,
  whatsapp_message TEXT DEFAULT 'Olá, preciso de suporte',
  subscription_status TEXT NOT NULL DEFAULT 'trial',
  plan_type TEXT NOT NULL DEFAULT 'basic',
  max_devices INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tabela de sessões Traccar (armazena JSESSIONID por usuário/tenant)
CREATE TABLE public.traccar_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  session_cookie TEXT NOT NULL,
  traccar_user_id INTEGER,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, user_email)
);

-- RLS: tenants são públicos para leitura (qualquer pessoa pode ver branding)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants are publicly readable"
  ON public.tenants FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Only service role can modify tenants"
  ON public.tenants FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- RLS: traccar_sessions só acessíveis via service_role (Edge Function)
ALTER TABLE public.traccar_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only service role can access traccar_sessions"
  ON public.traccar_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_tenants_slug ON public.tenants(slug);
CREATE INDEX idx_tenants_custom_domain ON public.tenants(custom_domain);
CREATE INDEX idx_traccar_sessions_tenant_email ON public.traccar_sessions(tenant_id, user_email);
