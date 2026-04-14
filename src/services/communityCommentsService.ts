import { supabase } from "@/integrations/supabase/client";

export interface CommunityCommentRow {
  id: string;
  post_id: string;
  user_id: string;
  author_name: string | null;
  is_anonymous: boolean;
  content: string;
  created_at: string;
}

export async function listCommentsByPost(postId: string): Promise<CommunityCommentRow[]> {
  const { data, error } = await supabase
    .from("community_post_comments")
    .select("*")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as CommunityCommentRow[]) ?? [];
}

export async function createComment(input: {
  postId: string;
  userId: string;
  authorName: string | null;
  isAnonymous: boolean;
  content: string;
}): Promise<CommunityCommentRow> {
  const { data, error } = await supabase
    .from("community_post_comments")
    .insert({
      post_id: input.postId,
      user_id: input.userId,
      author_name: input.authorName,
      is_anonymous: input.isAnonymous,
      content: input.content,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as CommunityCommentRow;
}
