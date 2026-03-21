
ALTER TABLE public.tenants 
ADD COLUMN IF NOT EXISTS trial_ends_at timestamp with time zone DEFAULT (now() + interval '7 days'),
ADD COLUMN IF NOT EXISTS owner_email text;

-- Permitir insert via anon para onboarding público
CREATE POLICY "Allow public tenant creation" ON public.tenants
FOR INSERT TO anon
WITH CHECK (true);
