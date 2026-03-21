
CREATE TABLE public.whatsapp_device_alert_prefs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  device_id integer NOT NULL,
  user_email text NOT NULL,
  alert_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, device_id, user_email, alert_type)
);

ALTER TABLE public.whatsapp_device_alert_prefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own device alert prefs"
ON public.whatsapp_device_alert_prefs FOR ALL TO authenticated
USING (
  tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid())
  OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid())
  OR user_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Service role full access whatsapp_device_alert_prefs"
ON public.whatsapp_device_alert_prefs FOR ALL TO service_role
USING (true) WITH CHECK (true);
