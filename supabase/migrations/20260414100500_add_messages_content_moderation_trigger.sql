-- Server-side prohibited content validation for messages.
-- Reuses shared prohibited-term function created in earlier migration.

CREATE OR REPLACE FUNCTION public.validate_message_content()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  matched_pattern text;
BEGIN
  matched_pattern := public.find_prohibited_term(NEW.content);
  IF matched_pattern IS NOT NULL THEN
    RAISE EXCEPTION 'Message content violates moderation policy (pattern: %)', matched_pattern
      USING ERRCODE = '22000';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS messages_content_moderation_trigger ON public.messages;

CREATE TRIGGER messages_content_moderation_trigger
BEFORE INSERT OR UPDATE ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.validate_message_content();
