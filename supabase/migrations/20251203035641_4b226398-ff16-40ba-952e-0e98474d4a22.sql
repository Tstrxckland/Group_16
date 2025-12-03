-- Set anonymous mode default to off for new profiles
ALTER TABLE public.profiles
  ALTER COLUMN is_anonymous SET DEFAULT false;