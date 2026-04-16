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

export async function deltaPostLikes(postId: string, delta: 1 | -1): Promise<number> {
  const { data, error } = await supabase.rpc("delta_community_post_likes", {
    p_delta: delta,
    p_id: postId,
  });
  if (error) throw error;
  return data as number;
}

export async function listLikeCountsByPostId(postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const { data, error } = await (supabase
    .from("community_post_likes" as any)
    .select("post_id")
    .in("post_id", postIds) as any);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const id of postIds) counts[id] = 0;
  for (const row of (data as Array<{ post_id: string }>) ?? []) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
  }
  return counts;
}

export async function countLikesForPost(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("community_post_likes" as any)
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) throw error;
  return count ?? 0;
}

export async function listLikedPostIdsForUser(userId: string): Promise<string[]> {
  const { data, error } = await (supabase
    .from("community_post_likes" as any)
    .select("post_id")
    .eq("user_id", userId) as any);
  if (error) throw error;
  return ((data as Array<{ post_id: string }>) ?? []).map((row) => row.post_id);
}

export async function likePost(postId: string, userId: string): Promise<void> {
  const { error } = await (supabase
    .from("community_post_likes" as any)
    .insert({ post_id: postId, user_id: userId }) as any);
  if (error) throw error;
}

export async function unlikePost(postId: string, userId: string): Promise<void> {
  const { error } = await (supabase
    .from("community_post_likes" as any)
    .delete()
    .eq("post_id", postId)
    .eq("user_id", userId) as any);
  if (error) throw error;
}

export async function countCommentsForPost(postId: string): Promise<number> {
  const { count, error } = await supabase
    .from("community_post_comments" as any)
    .select("id", { count: "exact", head: true })
    .eq("post_id", postId);
  if (error) throw error;
  return count ?? 0;
}

export async function listCommentCountsByPostId(postIds: string[]): Promise<Record<string, number>> {
  if (postIds.length === 0) return {};
  const { data, error } = await (supabase
    .from("community_post_comments" as any)
    .select("post_id")
    .in("post_id", postIds) as any);
  if (error) throw error;

  const counts: Record<string, number> = {};
  for (const id of postIds) counts[id] = 0;
  for (const row of (data as Array<{ post_id: string }>) ?? []) {
    counts[row.post_id] = (counts[row.post_id] ?? 0) + 1;
  }
  return counts;
}

export async function getDisplayNameForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("username")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && error.code !== "PGRST116") throw error;
  return (data?.username as string | undefined) ?? null;
}

export async function listUsernamesByUserId(userIds: string[]): Promise<Record<string, string>> {
  if (userIds.length === 0) return {};

  const { data, error } = await supabase
    .from("profiles")
    .select("user_id, username")
    .in("user_id", userIds);

  if (error) throw error;

  const usernames: Record<string, string> = {};
  for (const row of (data as Array<{ user_id: string; username: string | null }>) ?? []) {
    if (row.username) {
      usernames[row.user_id] = row.username;
    }
  }

  return usernames;
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
