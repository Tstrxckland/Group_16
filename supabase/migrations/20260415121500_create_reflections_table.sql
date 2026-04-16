-- Private, user-owned text reflections (not tied to a journal entry).
CREATE TABLE IF NOT EXISTS public.reflections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own reflections"
ON public.reflections
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reflections"
ON public.reflections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reflections"
ON public.reflections
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reflections"
ON public.reflections
FOR DELETE
USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'update_reflections_updated_at'
  ) THEN
    CREATE TRIGGER update_reflections_updated_at
      BEFORE UPDATE ON public.reflections
      FOR EACH ROW
      EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

