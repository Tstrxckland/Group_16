-- Comments for community discussion posts
CREATE TABLE public.community_post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text,
  is_anonymous boolean NOT NULL DEFAULT true,
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.community_post_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Comments are viewable by everyone"
ON public.community_post_comments
FOR SELECT
USING (true);

-- Authenticated users can create their own comments
CREATE POLICY "Users can create their own comments"
ON public.community_post_comments
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.community_post_comments
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Authenticated users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.community_post_comments
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);
