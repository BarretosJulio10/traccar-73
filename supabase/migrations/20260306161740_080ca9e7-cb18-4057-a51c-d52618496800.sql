
-- Delete all traccar sessions
DELETE FROM public.traccar_sessions;

-- Delete the hypertracker tenant (keep mabtracker as default)
DELETE FROM public.tenants WHERE slug = 'hypertracker';
