-- Configurable moderation phrase store for edge moderation.
-- Enables phrase updates without redeploying functions.

CREATE TABLE IF NOT EXISTS public.moderation_phrases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  phrase text NOT NULL UNIQUE,
  category text NOT NULL CHECK (category IN ('profanity', 'sensitive', 'crisis')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_phrases ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read active moderation configuration
-- so the edge function can fetch via JWT-bound client.
DROP POLICY IF EXISTS "Authenticated can read moderation phrases" ON public.moderation_phrases;
CREATE POLICY "Authenticated can read moderation phrases"
ON public.moderation_phrases
FOR SELECT
TO authenticated
USING (true);

DROP TRIGGER IF EXISTS update_moderation_phrases_updated_at ON public.moderation_phrases;
CREATE TRIGGER update_moderation_phrases_updated_at
  BEFORE UPDATE ON public.moderation_phrases
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.moderation_phrases (phrase, category, is_active)
VALUES
  -- profanity
  ('fuck', 'profanity', true),
  ('fucking', 'profanity', true),
  ('fucked', 'profanity', true),
  ('fucks', 'profanity', true),
  ('shit', 'profanity', true),
  ('shits', 'profanity', true),
  ('shitting', 'profanity', true),
  ('damn', 'profanity', true),
  ('damned', 'profanity', true),
  ('damnit', 'profanity', true),
  ('ass', 'profanity', true),
  ('asshole', 'profanity', true),
  ('asses', 'profanity', true),
  ('bitch', 'profanity', true),
  ('bitches', 'profanity', true),
  ('bastard', 'profanity', true),
  ('bastards', 'profanity', true),
  ('crap', 'profanity', true),
  ('crappy', 'profanity', true),
  ('hell', 'profanity', true),
  ('piss', 'profanity', true),
  ('pissed', 'profanity', true),
  -- crisis
  ('kill myself', 'crisis', true),
  ('kill me', 'crisis', true),
  ('end my life', 'crisis', true),
  ('end it all', 'crisis', true),
  ('want to die', 'crisis', true),
  ('wanna die', 'crisis', true),
  ('suicide', 'crisis', true),
  ('suicidal', 'crisis', true),
  ('self harm', 'crisis', true),
  ('self-harm', 'crisis', true),
  ('cut myself', 'crisis', true),
  ('hurt myself', 'crisis', true),
  -- sensitive (slurs)
  ('retard', 'sensitive', true),
  ('retarded', 'sensitive', true),
  ('faggot', 'sensitive', true),
  ('fag', 'sensitive', true),
  ('nigger', 'sensitive', true),
  ('nigga', 'sensitive', true)
ON CONFLICT (phrase) DO UPDATE
SET category = EXCLUDED.category,
    is_active = EXCLUDED.is_active;
