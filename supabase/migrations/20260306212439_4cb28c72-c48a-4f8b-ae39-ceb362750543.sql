
CREATE TABLE public.pwa_installations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  installed_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.pwa_installations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenants are publicly readable pwa_installations"
  ON public.pwa_installations
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert pwa_installations"
  ON public.pwa_installations
  FOR INSERT
  WITH CHECK (true);
