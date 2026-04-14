-- Server-side prohibited content validation for community_posts
-- Last-line defense in case client moderation is bypassed.

CREATE OR REPLACE FUNCTION public.find_prohibited_term(input_text text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  normalized text;
  patterns text[] := ARRAY[
    -- profanity
    '\m(fuck|fucking|fucked|fucks)\M',
    '\m(shit|shits|shitting)\M',
    '\m(damn|damned|damnit)\M',
    '\m(ass|asshole|asses)\M',
    '\m(bitch|bitches)\M',
    '\m(bastard|bastards)\M',
    '\m(crap|crappy)\M',
    '\mhell\M',
    '\m(piss|pissed)\M',
    -- crisis
    'kill[[:space:]]+myself',
    'kill[[:space:]]+me',
    'end[[:space:]]+my[[:space:]]+life',
    'end[[:space:]]+it[[:space:]]+all',
    'want[[:space:]]+to[[:space:]]+die',
    'wanna[[:space:]]+die',
    '\m(suicide|suicidal)\M',
    'self[-[:space:]]?harm',
    'cut[[:space:]]+myself',
    'hurt[[:space:]]+myself',
    -- slurs
    '\m(retard|retarded)\M',
    '\m(faggot|fag)\M',
    '\m(nigger|nigga)\M'
  ];
  p text;
BEGIN
  normalized := coalesce(input_text, '');
  IF btrim(normalized) = '' THEN
    RETURN NULL;
  END IF;

  FOREACH p IN ARRAY patterns LOOP
    IF normalized ~* p THEN
      RETURN p;
    END IF;
  END LOOP;

  RETURN NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_community_post_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  matched_pattern text;
BEGIN
  matched_pattern := public.find_prohibited_term(NEW.content);
  IF matched_pattern IS NOT NULL THEN
    RAISE EXCEPTION 'Post content violates moderation policy (pattern: %)', matched_pattern
      USING ERRCODE = '22000';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_posts_content_moderation_trigger ON public.community_posts;

CREATE TRIGGER community_posts_content_moderation_trigger
BEFORE INSERT OR UPDATE ON public.community_posts
FOR EACH ROW
EXECUTE FUNCTION public.validate_community_post_content();
