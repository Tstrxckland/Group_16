-- Ensure Supabase Realtime delivers INSERT events for messages.
-- Without this, `postgres_changes` subscriptions may not receive updates.

ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

