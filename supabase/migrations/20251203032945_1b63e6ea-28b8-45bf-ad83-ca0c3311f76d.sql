-- Add discreet_mode preference to profiles
ALTER TABLE public.profiles
ADD COLUMN discreet_mode boolean NOT NULL DEFAULT false;