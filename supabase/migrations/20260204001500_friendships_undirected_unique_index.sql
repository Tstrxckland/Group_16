-- Prevent duplicate reverse-direction friendship rows for the same two profiles.
-- Existing UNIQUE(requester_profile_id, addressee_profile_id) blocks exact duplicates only.
-- This index enforces uniqueness regardless of requester/addressee ordering.
CREATE UNIQUE INDEX IF NOT EXISTS friendships_unique_pair_undirected_idx
ON public.friendships (
  LEAST(requester_profile_id, addressee_profile_id),
  GREATEST(requester_profile_id, addressee_profile_id)
);
