-- Add indexes to keep message queries fast as history grows.
-- Primary access pattern: list messages for a friendship ordered by created_at.

CREATE INDEX IF NOT EXISTS messages_friendship_id_created_at_idx
ON public.messages (friendship_id, created_at);

-- Helpful for user-centric message queries and moderation/admin tooling.
CREATE INDEX IF NOT EXISTS messages_sender_profile_id_created_at_idx
ON public.messages (sender_profile_id, created_at);

