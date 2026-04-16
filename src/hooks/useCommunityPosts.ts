import { useCallback, useEffect, useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  countCommentsForPost,
  countLikesForPost,
  createCommunityPost,
  deleteCommunityPost,
  getCommunityPostById,
  getDisplayNameForUser,
  listCommentCountsByPostId,
  listCommunityPosts,
  listLikedPostIdsForUser,
  listLikeCountsByPostId,
  listUsernamesByUserId,
  likePost,
  unlikePost,
  updateCommunityPostContent,
} from "@/services/communityPostsService";
import { moderateContent } from "@/services/moderationService";
import { censorContent, detectSensitiveContent } from "@/lib/contentModeration";
import { sanitizeText } from "@/lib/sanitize";
import { messageFromSupabaseError } from "@/lib/supabaseErrors";

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
}, resolvedUsername?: string | null): ForumPost {
  const authorName =
    !row.is_anonymous && (!row.author_name || row.author_name === "User")
      ? resolvedUsername ?? row.author_name
      : row.author_name;
  const sanitizedAuthor = sanitizeText(authorName ?? "");
  const sanitizedContent = sanitizeText(row.content ?? "");
  const createdAt = row.created_at ?? new Date().toISOString();
  const createdAtDate = new Date(createdAt);
  const timeAgo = Number.isNaN(createdAtDate.getTime())
    ? "recently"
    : formatDistanceToNow(createdAtDate, { addSuffix: true });

  return {
    id: row.id,
    userId: row.user_id,
    author: row.is_anonymous
      ? "Anonymous"
      : sanitizedAuthor || "Community member",
    isAnonymous: row.is_anonymous,
    content: sanitizedContent,
    likes: Number.isFinite(row.likes) ? row.likes : 0,
    comments: 0,
    timeAgo,
    tags: (row.tags || []).map((tag) => sanitizeText(tag)).filter(Boolean),
    createdAt,
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
  adjustPostCommentCount: (postId: string, delta: number) => void;
  setPostCommentCount: (postId: string, count: number) => void;
  isPosting: boolean;
  setIsPosting: (v: boolean) => void;
  /** When not `"all"`, new posts get this tag so they appear in that discussion space. */
  newPostTopicId: PostSpaceId;
  setNewPostTopicId: (id: PostSpaceId) => void;
  newPostTitle: string;
  setNewPostTitle: (v: string) => void;
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
  editTitle: string;
  setEditTitle: (v: string) => void;
  editContent: string;
  setEditContent: (v: string) => void;
  saveEdit: () => Promise<void>;
}

function splitPostContent(content: string): { title: string; body: string } {
  const normalized = (content || "").replace(/\r\n/g, "\n");
  const parts = normalized.split("\n");
  const title = (parts[0] || "").trim();
  const body = parts.slice(1).join("\n").trim();
  return { title, body };
}

export function useCommunityPosts(): UseCommunityPostsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [newPostTopicId, setNewPostTopicId] = useState<PostSpaceId>("all");
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPost, setNewPost] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [editingPost, setEditingPost] = useState<ForumPost | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const fetchPosts = useCallback(async () => {
    try {
      const data = await listCommunityPosts();
      const postIds = data.map((row) => row.id);
      const missingAuthorUserIds = Array.from(
        new Set(
          data
            .filter((row) => !row.is_anonymous && (!row.author_name || row.author_name === "User"))
            .map((row) => row.user_id),
        ),
      );
      const [commentCounts, likeCounts, likedIds, usernamesByUserId] = await Promise.all([
        listCommentCountsByPostId(postIds),
        listLikeCountsByPostId(postIds),
        user ? listLikedPostIdsForUser(user.id) : Promise.resolve([]),
        listUsernamesByUserId(missingAuthorUserIds),
      ]);
      const safePosts: ForumPost[] = [];
      for (const row of data) {
        try {
          const next = formatPostRow(row, usernamesByUserId[row.user_id]);
          next.comments = commentCounts[row.id] ?? 0;
          next.likes = likeCounts[row.id] ?? 0;
          safePosts.push(next);
        } catch (rowError) {
          console.error("Skipping malformed community post row:", rowError, row);
        }
      }
      setPosts(safePosts);
      setLikedPosts(likedIds);
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
  }, [toast, user]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const fetchPostById = useCallback(
    async (postId: string) => {
      try {
        const data = await getCommunityPostById(postId);
        if (!data) return null;
        const resolvedUsername =
          !data.is_anonymous && (!data.author_name || data.author_name === "User")
            ? await getDisplayNameForUser(data.user_id)
            : null;
        const post = formatPostRow(data, resolvedUsername);
        const [commentCount, likeCount] = await Promise.all([
          countCommentsForPost(postId),
          countLikesForPost(postId),
        ]);
        post.comments = commentCount;
        post.likes = likeCount;
        return post;
      } catch (error) {
        console.error("Error fetching post:", error);
        toast({
          title: "Thread not found",
          description: "It may have been removed.",
          variant: "destructive",
        });
        return null;
      }
    },
    [toast],
  );

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = likedPosts.includes(postId);
    const previousLikedPosts = likedPosts;
    let previousLikes: number | null = null;
    setLikedPosts((prev) =>
      isLiked ? prev.filter((id) => id !== postId) : [...prev, postId],
    );

    let optimisticLikes: number | null = null;
    setPosts((prev) =>
      prev.map((post) => {
        if (post.id !== postId) return post;
        previousLikes = post.likes;
        const nextLikes = isLiked ? Math.max(0, post.likes - 1) : post.likes + 1;
        optimisticLikes = nextLikes;
        return { ...post, likes: nextLikes };
      }),
    );

    try {
      if (isLiked) await unlikePost(postId, user.id);
      else await likePost(postId, user.id);
    } catch (error) {
      // Roll back optimistic updates when persistence fails.
      setLikedPosts(previousLikedPosts);
      if (previousLikes !== null || optimisticLikes !== null) {
        setPosts((prev) =>
          prev.map((post) =>
            post.id === postId ? { ...post, likes: previousLikes as number } : post,
          ),
        );
      }
      console.error("Error updating like:", error);
      toast({
        title: "Couldn't update like",
        description: messageFromSupabaseError(error),
        variant: "destructive",
      });
    }
  };

  const adjustPostCommentCount = useCallback((postId: string, delta: number) => {
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, comments: Math.max(0, (post.comments || 0) + delta) }
          : post,
      ),
    );
  }, []);

  const setPostCommentCount = useCallback((postId: string, count: number) => {
    setPosts((prev) =>
      prev.map((post) => (post.id === postId ? { ...post, comments: Math.max(0, count) } : post)),
    );
  }, []);

  const submitPost = async () => {
    const trimmedTitle = newPostTitle.trim();
    const trimmedBody = newPost.trim();
    if (!trimmedTitle || !trimmedBody || !user) return;
    const composedContent = `${trimmedTitle}\n\n${trimmedBody}`;

    const { hasCrisisContent } = detectSensitiveContent(composedContent);
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
      const moderation = await moderateContent(composedContent);
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
        authorName =
          profileDisplayName ||
          user.user_metadata?.username ||
          user.user_metadata?.display_name ||
          "User";
      }

      const censoredContent = censorContent(composedContent);
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
      setNewPostTitle("");
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
        description: messageFromSupabaseError(error),
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
        description: messageFromSupabaseError(error),
        variant: "destructive",
      });
    }
  };

  const startEditing = (post: ForumPost) => {
    const { title, body } = splitPostContent(post.content);
    setEditingPost(post);
    setEditTitle(title);
    setEditContent(body);
  };

  const cancelEditing = () => {
    setEditingPost(null);
    setEditTitle("");
    setEditContent("");
  };

  const saveEdit = async () => {
    const trimmedTitle = editTitle.trim();
    const trimmedBody = editContent.trim();
    if (!editingPost || !trimmedTitle || !trimmedBody) return;
    const nextContent = `${trimmedTitle}\n\n${trimmedBody}`;

    setSubmitting(true);
    try {
      await updateCommunityPostContent(editingPost.id, nextContent);

      setPosts((prev) =>
        prev.map((post) =>
          post.id === editingPost.id ? { ...post, content: sanitizeText(nextContent) } : post,
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
        description: messageFromSupabaseError(error),
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
    adjustPostCommentCount,
    setPostCommentCount,
    isPosting,
    setIsPosting,
    newPostTopicId,
    setNewPostTopicId,
    newPostTitle,
    setNewPostTitle,
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
    editTitle,
    setEditTitle,
    editContent,
    setEditContent,
    saveEdit,
  };
}
