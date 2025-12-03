-- Add is_anonymous column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_anonymous boolean NOT NULL DEFAULT true;