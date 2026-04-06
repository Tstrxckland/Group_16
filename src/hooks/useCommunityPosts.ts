import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { censorContent, detectSensitiveContent } from "@/lib/contentModeration";

export interface ForumPost {
  id: string;
  userId: string;
  author: string;
  isAnonymous: boolean;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  tags: string[];
  createdAt: string;
}

export function formatPostRow(row: {
  id: string;
  user_id: string;
  author_name: string | null;
  is_anonymous: boolean;
  content: string;
  likes: number;
  tags: string[] | null;
  created_at: string;
}): ForumPost {
  return {
    id: row.id,
    userId: row.user_id,
    author: row.is_anonymous
      ? "Anonymous"
      : row.author_name || "Community member",
    isAnonymous: row.is_anonymous,
    content: row.content,
    likes: row.likes,
    comments: 0,
    timeAgo: formatDistanceToNow(new Date(row.created_at), { addSuffix: true }),
    tags: row.tags || [],
    createdAt: row.created_at,
  };
}

/** Must match topic slugs used in `Community.tsx` / `postMatchesTopic`. */
export const POST_SPACE_IDS = ["all", "wins", "support", "college", "work"] as const;
export type PostSpaceId = (typeof POST_SPACE_IDS)[number];

export interface UseCommunityPostsReturn {
  posts: ForumPost[];
  loading: boolean;
  refetchPosts: () => Promise<void>;
  fetchPostById: (postId: string) => Promise<ForumPost | null>;
  likedPosts: string[];
  toggleLike: (postId: string) => Promise<void>;
  isPosting: boolean;
  setIsPosting: (v: boolean) => void;
  /** When not `"all"`, new posts get this tag so they appear in that discussion space. */
  newPostTopicId: PostSpaceId;
  setNewPostTopicId: (id: PostSpaceId) => void;
  newPost: string;
  setNewPost: (v: string) => void;
  postAnonymously: boolean;
  setPostAnonymously: (v: boolean) => void;
  submitting: boolean;
  submitPost: () => Promise<void>;
  deletePost: (postId: string) => Promise<void>;
  editingPost: ForumPost | null;
  startEditing: (post: ForumPost) => void;
  cancelEditing: () => void;
  editContent: string;
  setEditContent: (v: string) => void;
  saveEdit: () => Promise<void>;
}

export function useCommunityPosts(): UseCommunityPostsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostTopicId, setNewPostTopicId] = useState<PostSpaceId>("all");
  const [newPost, setNewPost] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editContent, setEditContent] = useState("");

  const fetchPosts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPosts((data || []).map(formatPostRow));
    } catch (error) {
      console.error("Error fetching posts:", error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchPostById = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .eq("id", postId)
        .single();

      if (error) throw error;
      return data ? formatPostRow(data) : null;
    } catch (error) {
      console.error("Error fetching post:", error);
      toast({
        title: "Thread not found",
        description: "It may have been removed.",
        variant: "destructive",
      });
      return null;
    }
  };

  const toggleLike = async (postId: string) => {
    const isLiked = likedPosts.includes(postId);
    setLikedPosts((prev) =>
      isLiked ? prev.filter((id) => id !== postId) : [...prev, postId],
    );

    let newLikes: number | null = null;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        const nextLikes = isLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
        newLikes = nextLikes;
        return { ...post, likes: nextLikes };
      }),
    );

    if (newLikes !== null) {
      await supabase.from("community_posts").update({ likes: newLikes }).eq("id", postId);
    }
  };

  const submitPost = async () => {
    if (!newPost.trim() || !user) return;

    const { hasCrisisContent } = detectSensitiveContent(newPost);
    if (hasCrisisContent) {
      toast({
        title: "We care about you",
        description:
          "If you're struggling, please reach out to a crisis helpline. Your post will still be shared, but consider talking to someone who can help.",
        duration: 8000,
      });
    }

    setSubmitting(true);
    try {
      let authorName = null;
      if (!postAnonymously) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("user_id", user.id)
          .single();

        authorName =
          profile?.display_name || user.user_metadata?.display_name || "User";
      }

      const censoredContent = censorContent(newPost);
      const tagsForPost =
        newPostTopicId === "all" ? [] : [newPostTopicId];

      const { data, error } = await supabase
        .from("community_posts")
        .insert({
          user_id: user.id,
          author_name: authorName,
          is_anonymous: postAnonymously,
          content: censoredContent,
          tags: tagsForPost,
        })
        .select()
        .single();

      if (error) throw error;

      const newPostData: ForumPost = {
        id: data.id,
        userId: user.id,
        author: postAnonymously ? "Anonymous" : authorName || "User",
        isAnonymous: postAnonymously,
        content: censoredContent,
        likes: 0,
        comments: 0,
        timeAgo: "Just now",
        tags: tagsForPost,
        createdAt: data.created_at,
      };

      setPosts((prev) => [newPostData, ...prev]);
      setNewPost("");
      setNewPostTopicId("all");
      setIsPosting(false);

      toast({
        title: "Posted!",
        description: "Your post has been shared with the community.",
      });
    } catch (error) {
      console.error("Error creating post:", error);
      toast({
        title: "Error",
        description: "Failed to create post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase.from("community_posts").delete().eq("id", postId);
      if (error) throw error;

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      toast({
        title: "Deleted",
        description: "Your post has been removed.",
      });
    } catch (error) {
      console.error("Error deleting post:", error);
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive",
      });
    }
  };

  const startEditing = (post: ForumPost) => {
    setEditingPost(post);
    setEditContent(post.content);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditContent("");
  };

  const saveEdit = async () => {
    if (!editingPost || !editContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from("community_posts")
        .update({ content: editContent })
        .eq("id", editingPost.id);

      if (error) throw error;

      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingPost.id ? { ...post, content: editContent } : post,
        ),
      );

      toast({
        title: "Updated",
        description: "Your post has been edited.",
      });

      cancelEditing();
    } catch (error) {
      console.error("Error updating post:", error);
      toast({
        title: "Error",
        description: "Failed to update post.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return {
    posts,
    loading,
    refetchPosts: fetchPosts,
    fetchPostById,
    likedPosts,
    toggleLike,
    isPosting,
    setIsPosting,
    newPostTopicId,
    setNewPostTopicId,
    newPost,
    setNewPost,
    postAnonymously,
    setPostAnonymously,
    submitting,
    submitPost,
    deletePost,
    editingPost,
    startEditing,
    cancelEditing,
    editContent,
    setEditContent,
    saveEdit,
  };
}
