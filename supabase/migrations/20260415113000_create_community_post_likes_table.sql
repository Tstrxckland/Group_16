-- Per-user likes for community posts (cross-device source of truth).
CREATE TABLE IF NOT EXISTS public.community_post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_post_likes_post_user_unique UNIQUE (post_id, user_id)
);

ALTER TABLE public.community_post_likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_likes'
      AND policyname = 'Post likes are viewable by everyone'
  ) THEN
    CREATE POLICY "Post likes are viewable by everyone"
      ON public.community_post_likes
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_likes'
      AND policyname = 'Users can like as themselves'
  ) THEN
    CREATE POLICY "Users can like as themselves"
      ON public.community_post_likes
      FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'community_post_likes'
      AND policyname = 'Users can unlike their own likes'
  ) THEN
    CREATE POLICY "Users can unlike their own likes"
      ON public.community_post_likes
      FOR DELETE
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;
END
$$;

