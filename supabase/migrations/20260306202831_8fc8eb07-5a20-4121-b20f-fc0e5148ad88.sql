ALTER TABLE public.tenants
ADD COLUMN IF NOT EXISTS login_sidebar_color TEXT,
ADD COLUMN IF NOT EXISTS login_bg_image TEXT,
ADD COLUMN IF NOT EXISTS login_bg_color TEXT;