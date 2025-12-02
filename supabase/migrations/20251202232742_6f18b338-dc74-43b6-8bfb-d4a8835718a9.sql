-- Add optional unique username to profiles for friend identification
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS username text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx
ON public.profiles (username);

-- Friend request status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'friend_request_status') THEN
    CREATE TYPE public.friend_request_status AS ENUM ('pending', 'accepted', 'declined', 'blocked');
  END IF;
END$$;

-- Friendships table to track friend requests and relationships
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status public.friend_request_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  CONSTRAINT friendships_requester_addressee_check CHECK (requester_profile_id <> addressee_profile_id),
  CONSTRAINT friendships_unique_pair UNIQUE (requester_profile_id, addressee_profile_id)
);

-- Keep updated_at in sync
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_friendships_updated_at'
  ) THEN
    CREATE TRIGGER update_friendships_updated_at
    BEFORE UPDATE ON public.friendships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END$$;

-- Enable RLS on friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they participate in
CREATE POLICY "Users can view their friendships"
ON public.friendships
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = requester_profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = addressee_profile_id
      AND p.user_id = auth.uid()
  )
);

-- Users can create friendship requests where they are the requester
CREATE POLICY "Users can create friendship requests as requester"
ON public.friendships
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = requester_profile_id
      AND p.user_id = auth.uid()
  )
);

-- Users can update friendships they participate in (e.g. accept/decline/cancel)
CREATE POLICY "Users can update their friendships"
ON public.friendships
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = requester_profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = addressee_profile_id
      AND p.user_id = auth.uid()
  )
);

-- Users can delete friendships they participate in
CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = requester_profile_id
      AND p.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = addressee_profile_id
      AND p.user_id = auth.uid()
  )
);