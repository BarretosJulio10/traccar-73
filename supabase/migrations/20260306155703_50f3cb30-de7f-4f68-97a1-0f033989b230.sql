
-- Remove the overly permissive insert policy, we'll use an edge function instead
DROP POLICY IF EXISTS "Allow public tenant creation" ON public.tenants;
