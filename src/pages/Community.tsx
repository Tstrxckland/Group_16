import { useEffect, useMemo, useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/useAuth";
import { useDiscreetMode } from "@/hooks/useDiscreetMode";
import { type ForumPost } from "@/hooks/useCommunityPosts";
import { CommunityForumProvider, useCommunityForum } from "@/context/communityForumContext";
import {
  Users,
  MessageCircle,
  Heart,
  Send,
  EyeOff,
  Shield,
  Plus,
  Loader2,
  Trash2,
  Pencil,
  ChevronRight,
  ArrowLeft,
  Sparkles,
  Briefcase,
  GraduationCap,
  LifeBuoy,
} from "lucide-react";
import { censorContent } from "@/lib/contentModeration";

const TOPIC_IDS = ["all", "wins", "support", "college", "work"] as const;
export type TopicId = (typeof TOPIC_IDS)[number];

export const DISCUSSION_GROUPS: {
  id: TopicId;
  name: string;
  description: string;
  icon: typeof MessageCircle;
}[] = [
  {
    id: "all",
    name: "All discussions",
    description: "Browse every thread in one calm list.",
    icon: MessageCircle,
  },
  {
    id: "wins",
    name: "Wins",
    description: "Celebrate steps forward, no matter the size.",
    icon: Sparkles,
  },
  {
    id: "support",
    name: "Support",
    description: "Ask for encouragement or sit with others.",
    icon: LifeBuoy,
  },
  {
    id: "college",
    name: "College",
    description: "School stress, plans, and campus life.",
    icon: GraduationCap,
  },
  {
    id: "work",
    name: "Work",
    description: "Jobs, burnout, and balance.",
    icon: Briefcase,
  },
];

export function deriveThreadTitle(content: string): string {
  const first = content.split(/\n/)[0]?.trim() || "";
  if (!first) return "Shared reflection";
  if (first.length <= 72) return first;
  return `${first.slice(0, 69)}…`;
}

export function deriveThreadPreview(content: string): string {
  const lines = content.split(/\n/).map((l) => l.trim()).filter(Boolean);
  const body = lines.length > 1 ? lines.slice(1).join(" ") : content.trim();
  const cleaned = body.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= 100) return cleaned;
  return `${cleaned.slice(0, 97)}…`;
}

export function postMatchesTopic(post: ForumPost, topicId: TopicId): boolean {
  if (topicId === "all") return true;
  const needle = topicId.toLowerCase();
  return (post.tags || []).some((t) => t.toLowerCase() === needle);
}

/** Prefer a specific space for “back” navigation when tags match. */
function topicSlugForBack(post: ForumPost): TopicId {
  for (const g of DISCUSSION_GROUPS) {
    if (g.id === "all") continue;
    if (postMatchesTopic(post, g.id)) return g.id;
  }
  return "all";
}

function ForumModals() {
  const {
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
    editingPost,
    cancelEditing,
    editContent,
    setEditContent,
    saveEdit,
  } = useCommunityForum();

  const postingInGroup =
    newPostTopicId !== "all"
      ? DISCUSSION_GROUPS.find((g) => g.id === newPostTopicId)
      : undefined;

  return (
    <>
      {isPosting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in sm:items-center">
          <Card className="w-full max-w-lg rounded-b-none sm:rounded-2xl animate-slide-in-right pb-20 sm:pb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="h-5 w-5 text-primary" />
                Share with the community
              </CardTitle>
              {postingInGroup && (
                <p className="text-sm text-muted-foreground">
                  Posting in{" "}
                  <span className="font-medium text-foreground">
                    {postingInGroup.name}
                  </span>
                </p>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind? Share a win, ask for support, or just vent..."
                className="min-h-[120px] rounded-xl text-base"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                aria-label="Write your post"
              />

              <div className="flex items-center justify-between rounded-xl bg-muted p-4">
                <div className="flex items-center gap-3">
                  <EyeOff className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Post anonymously</p>
                    <p className="text-sm text-muted-foreground">
                      Your identity will be hidden
                    </p>
                  </div>
                </div>
                <Switch
                  checked={postAnonymously}
                  onCheckedChange={setPostAnonymously}
                />
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={() => {
                    setNewPostTopicId("all");
                    setIsPosting(false);
                  }}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="calm"
                  className="flex-1 rounded-xl"
                  onClick={submitPost}
                  disabled={!newPost.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Post
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in sm:items-center">
          <Card className="w-full max-w-lg rounded-b-none sm:rounded-2xl animate-slide-in-right pb-20 sm:pb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Pencil className="h-5 w-5 text-primary" />
                Edit your post
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Edit your post..."
                className="min-h-[120px] rounded-xl text-base"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                aria-label="Edit post text"
              />

              <div className="flex flex-col-reverse gap-3 sm:flex-row">
                <Button
                  variant="outline"
                  className="flex-1 rounded-xl"
                  onClick={cancelEditing}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="calm"
                  className="flex-1 rounded-xl"
                  onClick={saveEdit}
                  disabled={!editContent.trim() || submitting}
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Save
                      <Send className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

/** Forum landing: discussion groups / spaces */
export function CommunityForumHome() {
  const { posts, loading, setIsPosting, setNewPostTopicId } = useCommunityForum();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of DISCUSSION_GROUPS) {
      map[g.id] = posts.filter((p) => postMatchesTopic(p, g.id)).length;
    }
    return map;
  }, [posts]);

  return (
    <div className="space-y-6">
      <header className="animate-fade-up">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 shrink-0 text-primary" aria-hidden />
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Community forum
            </h1>
          </div>
          <Button
            variant="calm"
            size="sm"
            className="shrink-0 rounded-xl"
            onClick={() => {
              setNewPostTopicId("all");
              setIsPosting(true);
            }}
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New post</span>
            <span className="sm:hidden">Post</span>
          </Button>
        </div>
        <p className="mt-2 max-w-md text-muted-foreground">
          Pick a space that fits how you feel today. Every thread is a chance to
          listen and be heard—gently.
        </p>
      </header>

      <Card
        className="cursor-pointer border-sage-200 bg-sage-100/80 shadow-none transition-shadow hover:shadow-card animate-fade-up animation-delay-100"
        onClick={() => {
          setNewPostTopicId("all");
          setIsPosting(true);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setNewPostTopicId("all");
            setIsPosting(true);
          }
        }}
        aria-label="Start writing a new post"
      >
        <CardContent className="flex items-center gap-3 p-4 sm:p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/80">
            <EyeOff className="h-5 w-5 text-muted-foreground" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-medium text-foreground">Share something</p>
            <p className="text-sm text-muted-foreground">
              Tap to open a calm composer—anonymous is always optional.
            </p>
          </div>
          <Send className="h-5 w-5 shrink-0 text-primary" aria-hidden />
        </CardContent>
      </Card>

      <Card className="border-primary/15 bg-card/80 animate-fade-up animation-delay-150">
        <CardContent className="flex items-start gap-3 p-4">
          <Shield
            className="mt-0.5 h-5 w-5 shrink-0 text-primary"
            aria-hidden
          />
          <p className="text-sm leading-relaxed text-foreground">
            This forum is moderated for kindness. You belong here—take your time
            reading and responding.
          </p>
        </CardContent>
      </Card>

      <section
        className="animate-fade-up animation-delay-200"
        aria-labelledby="forum-spaces-heading"
      >
        <h2
          id="forum-spaces-heading"
          className="mb-3 font-display text-lg font-semibold text-foreground"
        >
          Discussion spaces
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Each space gathers threads with matching tags when people add them.
          “All discussions” shows everything.
        </p>

        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2
              className="h-7 w-7 animate-spin text-primary"
              aria-label="Loading spaces"
            />
          </div>
        ) : (
          <ul className="grid list-none gap-3 sm:gap-4">
            {DISCUSSION_GROUPS.map((group) => {
              const Icon = group.icon;
              const count = counts[group.id] ?? 0;
              return (
                <li key={group.id}>
                  <Link
                    to={`/community/t/${group.id}`}
                    className="block rounded-2xl outline-none ring-offset-2 transition-all focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Card className="border-border/60 shadow-sm transition-all hover:border-primary/25 hover:shadow-card">
                      <CardContent className="flex items-center gap-4 p-4 sm:p-5">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10">
                          <Icon className="h-6 w-6 text-primary" aria-hidden />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-foreground">
                              {group.name}
                            </h3>
                            <Badge
                              variant="secondary"
                              className="font-normal text-xs"
                            >
                              {count}{" "}
                              {count === 1 ? "thread" : "threads"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {group.description}
                          </p>
                        </div>
                        <ChevronRight
                          className="h-5 w-5 shrink-0 text-muted-foreground"
                          aria-hidden
                        />
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function isTopicId(s: string | undefined): s is TopicId {
  return !!s && (TOPIC_IDS as readonly string[]).includes(s);
}

/** Thread list for one space */
export function CommunityThreadList() {
  const { topicId: raw } = useParams<{ topicId: string }>();
  const topicId: TopicId = isTopicId(raw) ? raw : "all";
  const group = DISCUSSION_GROUPS.find((g) => g.id === topicId)!;
  const {
    posts,
    loading,
    setIsPosting,
    setNewPostTopicId,
    likedPosts,
    toggleLike,
  } = useCommunityForum();
  const { discreetMode } = useDiscreetMode();

  const filtered = useMemo(
    () => posts.filter((p) => postMatchesTopic(p, topicId)),
    [posts, topicId],
  );

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 animate-fade-up">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 shrink-0 rounded-xl px-2"
          asChild
        >
          <Link to="/community" aria-label="Back to forum home">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
            {group.name}
          </h1>
          <p className="text-sm text-muted-foreground">{group.description}</p>
        </div>
        <Button
          variant="calm"
          size="sm"
          className="shrink-0 rounded-xl"
          onClick={() => {
            setNewPostTopicId(topicId);
            setIsPosting(true);
          }}
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only sm:not-sr-only sm:ml-0">New</span>
        </Button>
      </div>

      <div
        className="-mx-1 flex gap-2 overflow-x-auto pb-1 animate-fade-up animation-delay-100"
        role="tablist"
        aria-label="Switch discussion space"
      >
        {DISCUSSION_GROUPS.map((t) => (
          <Button
            key={t.id}
            variant={topicId === t.id ? "default" : "outline"}
            size="sm"
            className="shrink-0 rounded-full"
            asChild
          >
            <Link to={`/community/t/${t.id}`}>{t.name}</Link>
          </Button>
        ))}
      </div>

      <div className="space-y-3 animate-fade-up animation-delay-200">
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-8 text-center">
              <MessageCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground/60" />
              <p className="font-medium text-foreground">No threads here yet</p>
              <p className="mt-2 text-sm text-muted-foreground">
                When someone posts with this space in mind, it will show up
                here. You can still share from “All discussions.”
              </p>
              <Button
                variant="calm"
                className="mt-6 rounded-xl"
                onClick={() => {
                  setNewPostTopicId(topicId);
                  setIsPosting(true);
                }}
              >
                Start a thread
              </Button>
            </CardContent>
          </Card>
        ) : (
          <ul className="list-none space-y-3">
            {filtered.map((post) => {
              const title = deriveThreadTitle(post.content);
              const preview = deriveThreadPreview(post.content);
              const displayContent = discreetMode
                ? censorContent(post.content)
                : post.content;
              const displayPreview =
                preview && discreetMode ? censorContent(preview) : preview;

              return (
                <li key={post.id}>
                  <Link
                    to={`/community/p/${post.id}`}
                    className="block rounded-2xl outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Card className="h-full border-border/60 transition-all hover:border-primary/20 hover:shadow-card">
                      <CardContent className="p-4 sm:p-5">
                        <h2 className="font-semibold leading-snug text-foreground line-clamp-2">
                          {discreetMode
                            ? censorContent(title)
                            : title}
                        </h2>
                        {displayPreview ? (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                            {displayPreview}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-2">
                            {displayContent.length > 100
                              ? `${displayContent.slice(0, 97)}…`
                              : displayContent}
                          </p>
                        )}

                        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border/50 pt-3">
                          <div className="flex min-w-0 items-center gap-2">
                            <div
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                                post.isAnonymous
                                  ? "bg-muted"
                                  : "bg-primary/15"
                              }`}
                            >
                              {post.isAnonymous ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <span className="text-sm font-medium text-primary">
                                  {post.author[0]}
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {post.author}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {post.timeAgo}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <button
                              type="button"
                              className={`flex items-center gap-1 text-sm transition-colors ${
                                likedPosts.includes(post.id)
                                  ? "text-terracotta-400"
                                  : "hover:text-terracotta-400"
                              }`}
                              onClick={async (e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                await toggleLike(post.id);
                              }}
                              aria-label={`Like, ${post.likes} likes`}
                            >
                              <Heart
                                className={`h-4 w-4 ${
                                  likedPosts.includes(post.id)
                                    ? "fill-current"
                                    : ""
                                }`}
                              />
                              {post.likes}
                            </button>
                            <span className="flex items-center gap-1 text-sm">
                              <MessageCircle className="h-4 w-4" />
                              {post.comments}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/** Single thread / post detail */
export function CommunityPostDetail() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { discreetMode } = useDiscreetMode();
  const { user } = useAuth();
  const {
    posts,
    loading,
    likedPosts,
    toggleLike,
    startEditing,
    deletePost,
    refetchPosts,
    fetchPostById,
  } = useCommunityForum();

  const [fetched, setFetched] = useState<ForumPost | null>(null);
  const [fetchingOne, setFetchingOne] = useState(false);

  const fromList = postId ? posts.find((p) => p.id === postId) : undefined;
  const post = fromList ?? fetched;

  useEffect(() => {
    if (!postId || fromList) {
      if (fromList) setFetched(null);
      return;
    }

    let cancelled = false;
    setFetchingOne(true);
    (async () => {
      try {
        if (cancelled) return;

        const data = await fetchPostById(postId);
        if (data) setFetched(data);
        else setFetched(null);
      } catch (e) {
        console.error(e);
        if (!cancelled) {
          setFetched(null);
        }
      } finally {
        if (!cancelled) setFetchingOne(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchPostById, fromList, postId]);

  if (!postId) {
    return null;
  }

  const busy = loading && !post && !fetched;
  if (busy || fetchingOne) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <Card className="mt-8">
        <CardContent className="p-8 text-center">
          <p className="text-muted-foreground">This thread is not available.</p>
          <Button variant="calm" className="mt-4 rounded-xl" asChild>
            <Link to="/community">Back to forum</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const title = deriveThreadTitle(post.content);
  const displayContent = discreetMode
    ? censorContent(post.content)
    : post.content;

  const topicForBack = topicSlugForBack(post);

  return (
    <article className="space-y-5">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-xl px-2"
          asChild
        >
          <Link
            to={`/community/t/${topicForBack}`}
            aria-label="Back to thread list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <span className="text-sm text-muted-foreground">Thread</span>
      </div>

      <Card className="overflow-hidden border-border/60 shadow-card">
        <CardHeader className="space-y-1 border-b border-border/40 bg-muted/30 pb-4">
          <h1 className="font-display text-xl font-bold leading-tight text-foreground sm:text-2xl">
            {discreetMode ? censorContent(title) : title}
          </h1>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full ${
                  post.isAnonymous ? "bg-muted" : "bg-primary/15"
                }`}
              >
                {post.isAnonymous ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <span className="text-sm font-semibold text-primary">
                    {post.author[0]}
                  </span>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{post.author}</p>
                <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-4 sm:p-6">
          <div className="prose prose-sm max-w-none text-base leading-relaxed text-foreground">
            <p className="whitespace-pre-wrap">{displayContent}</p>
          </div>

          {post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="rounded-md text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 border-t border-border/50 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={async () => {
                  await toggleLike(post.id);
                }}
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${
                  likedPosts.includes(post.id)
                    ? "text-terracotta-400"
                    : "text-muted-foreground hover:text-terracotta-400"
                }`}
                aria-pressed={likedPosts.includes(post.id)}
              >
                <Heart
                  className={`h-5 w-5 ${
                    likedPosts.includes(post.id) ? "fill-current" : ""
                  }`}
                />
                {post.likes}{" "}
                {post.likes === 1 ? "heart" : "hearts"}
              </button>
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <MessageCircle className="h-5 w-5" />
                Replies coming soon
              </span>
            </div>

            {user && post.userId === user.id && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => startEditing(post)}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="rounded-xl text-destructive hover:text-destructive"
                  onClick={async () => {
                    await deletePost(post.id);
                    navigate("/community");
                    await refetchPosts();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </article>
  );
}

/** Layout: provider, shell, outlet, modals */
export function CommunityLayout() {
  return (
    <CommunityForumProvider>
      <div className="gradient-hero min-h-screen px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
        <ForumModals />
      </div>
    </CommunityForumProvider>
  );
}

const Community = CommunityLayout;
export default Community;
