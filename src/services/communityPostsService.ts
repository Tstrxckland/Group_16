import { supabase } from "@/integrations/supabase/client";

export interface CommunityPostRow {
  id: string;
  user_id: string;
  author_name: string | null;
  is_anonymous: boolean;
  content: string;
  likes: number;
  tags: string[] | null;
  created_at: string;
}

export async function listCommunityPosts(): Promise<CommunityPostRow[]> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as CommunityPostRow[]) ?? [];
}

export async function getCommunityPostById(postId: string): Promise<CommunityPostRow | null> {
  const { data, error } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", postId)
    .single();
  if (error) throw error;
  return (data as CommunityPostRow | null) ?? null;
}

export async function updatePostLikes(postId: string, likes: number) {
  const { error } = await supabase.from("community_posts").update({ likes }).eq("id", postId);
  if (error) throw error;
}

export async function getDisplayNameForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data?.display_name as string | undefined) ?? null;
}

export async function createCommunityPost(input: {
  userId: string;
  authorName: string | null;
  isAnonymous: boolean;
  content: string;
  tags: string[];
}): Promise<CommunityPostRow> {
  const { data, error } = await supabase
    .from("community_posts")
    .insert({
      user_id: input.userId,
      author_name: input.authorName,
      is_anonymous: input.isAnonymous,
      content: input.content,
      tags: input.tags,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CommunityPostRow;
}

export async function deleteCommunityPost(postId: string) {
  const { error } = await supabase.from("community_posts").delete().eq("id", postId);
  if (error) throw error;
}

export async function updateCommunityPostContent(postId: string, content: string) {
  const { error } = await supabase
    .from("community_posts")
    .update({ content })
    .eq("id", postId);
  if (error) throw error;
}
