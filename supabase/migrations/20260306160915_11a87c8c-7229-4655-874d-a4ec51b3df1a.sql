
-- Add auth user_id to tenants to link with Supabase Auth
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- RLS: tenant owners can read/update their own tenant
CREATE POLICY "Tenant owners can read own tenant" ON public.tenants
FOR SELECT TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Tenant owners can update own tenant" ON public.tenants
FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
