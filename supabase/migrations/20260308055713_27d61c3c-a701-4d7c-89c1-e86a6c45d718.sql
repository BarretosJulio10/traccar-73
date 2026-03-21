
-- WhatsApp Instances: one per tenant
CREATE TABLE public.whatsapp_instances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  uazapi_instance_id text,
  uazapi_token text,
  status text NOT NULL DEFAULT 'disconnected',
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id)
);

-- WhatsApp Alert Configs: per tenant, per alert type
CREATE TABLE public.whatsapp_alert_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  template_message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(tenant_id, alert_type)
);

-- WhatsApp Message Log: audit trail
CREATE TABLE public.whatsapp_message_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  recipient_phone text NOT NULL,
  message_type text NOT NULL DEFAULT 'alert',
  message_content text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS Policies for whatsapp_instances
CREATE POLICY "Tenant owners can manage own whatsapp_instances"
ON public.whatsapp_instances FOR ALL TO authenticated
USING (tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access whatsapp_instances"
ON public.whatsapp_instances FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- RLS Policies for whatsapp_alert_configs
CREATE POLICY "Tenant owners can manage own whatsapp_alert_configs"
ON public.whatsapp_alert_configs FOR ALL TO authenticated
USING (tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid()))
WITH CHECK (tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access whatsapp_alert_configs"
ON public.whatsapp_alert_configs FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- RLS Policies for whatsapp_message_log
CREATE POLICY "Tenant owners can read own whatsapp_message_log"
ON public.whatsapp_message_log FOR SELECT TO authenticated
USING (tenant_id IN (SELECT id FROM public.tenants WHERE user_id = auth.uid()));

CREATE POLICY "Service role full access whatsapp_message_log"
ON public.whatsapp_message_log FOR ALL TO service_role
USING (true) WITH CHECK (true);
