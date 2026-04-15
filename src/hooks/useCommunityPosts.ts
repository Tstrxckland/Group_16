import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  createCommunityPost,
  deleteCommunityPost,
  getCommunityPostById,
  getDisplayNameForUser,
  listCommunityPosts,
  updateCommunityPostContent,
  updatePostLikes,
} from "@/services/communityPostsService";
import { moderateContent } from "@/services/moderationService";
import { censorContent, detectSensitiveContent } from "@/lib/contentModeration";
import { sanitizeText } from "@/lib/sanitize";

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
  const sanitizedAuthor = sanitizeText(row.author_name);
  const sanitizedContent = sanitizeText(row.content);
  return {
    id: row.id,
    userId: row.user_id,
    author: row.is_anonymous
      ? "Anonymous"
      : sanitizedAuthor || "Community member",
    isAnonymous: row.is_anonymous,
    content: sanitizedContent,
    likes: row.likes,
    comments: 0,
    timeAgo: formatDistanceToNow(new Date(row.created_at), { addSuffix: true }),
    tags: (row.tags || []).map((tag) => sanitizeText(tag)).filter(Boolean),
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
      const data = await listCommunityPosts();
      setPosts(data.map(formatPostRow));
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
      const data = await getCommunityPostById(postId);
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
    const previousLikedPosts = likedPosts;
    let previousLikes: number | null = null;
    setLikedPosts((prev) =>
      isLiked ? prev.filter((id) => id !== postId) : [...prev, postId],
    );

    let newLikes: number | null = null;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        previousLikes = post.likes;
        const nextLikes = isLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
        newLikes = nextLikes;
        return { ...post, likes: nextLikes };
      }),
    );

    try {
      if (newLikes !== null) {
        await updatePostLikes(postId, newLikes);
      }
    } catch (error) {
      // Roll back optimistic updates when persistence fails.
      setLikedPosts(previousLikedPosts);
      if (previousLikes !== null) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likes: previousLikes as number } : post,
          ),
        );
      }
      console.error("Error updating like:", error);
      toast({
        title: "Couldn't update like",
        description: "Please try again.",
        variant: "destructive",
      });
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
      const moderation = await moderateContent(newPost);
      if (!moderation.clean) {
        const categories = Array.from(new Set(moderation.flagged.map((f) => f.category)));
        toast({
          title: "Post blocked by moderation",
          description: `Please revise your post. Flagged categories: ${categories.join(", ")}.`,
          variant: "destructive",
        });
        return;
      }

      let authorName = null;
      if (!postAnonymously) {
        const profileDisplayName = await getDisplayNameForUser(user.id);
        authorName = profileDisplayName || user.user_metadata?.display_name || "User";
      }

      const censoredContent = censorContent(newPost);
      const tagsForPost =
        newPostTopicId === "all" ? [] : [newPostTopicId];

      const data = await createCommunityPost({
        userId: user.id,
        authorName,
        isAnonymous: postAnonymously,
        content: censoredContent,
        tags: tagsForPost,
      });

      const newPostData: ForumPost = {
        id: data.id,
        userId: user.id,
        author: postAnonymously ? "Anonymous" : authorName || "User",
        isAnonymous: postAnonymously,
        content: sanitizeText(censoredContent),
        likes: 0,
        comments: 0,
        timeAgo: "Just now",
        tags: tagsForPost.map((tag) => sanitizeText(tag)).filter(Boolean),
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
      await deleteCommunityPost(postId);

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
      await updateCommunityPostContent(editingPost.id, editContent);

      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingPost.id ? { ...post, content: sanitizeText(editContent) } : post,
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
