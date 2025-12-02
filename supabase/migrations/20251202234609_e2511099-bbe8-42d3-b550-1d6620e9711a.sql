-- Create messages table for friend-to-friend messaging
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  friendship_id uuid NOT NULL REFERENCES public.friendships(id) ON DELETE CASCADE,
  sender_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: users can insert messages in friendships they are part of (and only when accepted)
CREATE POLICY "Users can send messages in their friendships"
ON public.messages
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.friendships f
      ON (p.id = f.requester_profile_id OR p.id = f.addressee_profile_id)
    WHERE p.id = messages.sender_profile_id
      AND p.user_id = auth.uid()
      AND f.id = messages.friendship_id
      AND f.status = 'accepted'
  )
);

-- Policy: users can view messages in friendships they are part of
CREATE POLICY "Users can view messages in their friendships"
ON public.messages
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.friendships f
      ON (p.id = f.requester_profile_id OR p.id = f.addressee_profile_id)
    WHERE p.user_id = auth.uid()
      AND f.id = messages.friendship_id
      AND f.status = 'accepted'
  )
);
