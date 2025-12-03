import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Send,
  EyeOff,
  Shield,
  Plus,
  Loader2,
  Trash2
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  userId: string;
  author: string;
  isAnonymous: boolean;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  tags: string[];
}

const topics = [
  { name: "All", count: 156 },
  { name: "Wins", count: 43 },
  { name: "Support", count: 67 },
  { name: "College", count: 28 },
  { name: "Work", count: 18 },
];

const Community = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Fetch posts from database
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts: Post[] = (data || []).map(post => ({
        id: post.id,
        userId: post.user_id,
        author: post.is_anonymous ? "Anonymous" : (post.author_name || "User"),
        isAnonymous: post.is_anonymous,
        content: post.content,
        likes: post.likes,
        comments: 0,
        timeAgo: formatDistanceToNow(new Date(post.created_at), { addSuffix: true }),
        tags: post.tags || [],
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast({
        title: "Error",
        description: "Failed to load posts",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: string) => {
    // Optimistic update
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes - 1 } : p));
    } else {
      setLikedPosts([...likedPosts, postId]);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    }

    // Update in database
    const post = posts.find(p => p.id === postId);
    if (post) {
      const newLikes = likedPosts.includes(postId) ? post.likes - 1 : post.likes + 1;
      await supabase
        .from('community_posts')
        .update({ likes: newLikes })
        .eq('id', postId);
    }
  };

  const submitPost = async () => {
    if (!newPost.trim() || !user) return;

    setSubmitting(true);
    try {
      // Get user's display name if not posting anonymously
      let authorName = null;
      if (!postAnonymously) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('user_id', user.id)
          .single();
        authorName = profile?.display_name || user.user_metadata?.display_name || "User";
      }

      const { data, error } = await supabase
        .from('community_posts')
        .insert({
          user_id: user.id,
          author_name: authorName,
          is_anonymous: postAnonymously,
          content: newPost,
          tags: [],
        })
        .select()
        .single();

      if (error) throw error;

      const newPostData: Post = {
        id: data.id,
        userId: user.id,
        author: postAnonymously ? "Anonymous" : (authorName || "User"),
        isAnonymous: postAnonymously,
        content: data.content,
        likes: 0,
        comments: 0,
        timeAgo: "Just now",
        tags: [],
      };

      setPosts([newPostData, ...posts]);
      setNewPost("");
      setIsPosting(false);
      
      toast({
        title: "Posted!",
        description: "Your post has been shared with the community.",
      });
    } catch (error) {
      console.error('Error creating post:', error);
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
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(posts.filter(p => p.id !== postId));
      toast({
        title: "Deleted",
        description: "Your post has been removed.",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="gradient-hero min-h-screen px-6 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <h1 className="font-display text-2xl font-bold">Community</h1>
          </div>
          <Button
            variant="calm"
            size="sm"
            onClick={() => setIsPosting(true)}
          >
            <Plus className="h-4 w-4" />
            Post
          </Button>
        </div>
        <p className="text-muted-foreground mt-1">
          Connect with others who understand
        </p>
      </div>

      {/* Compose Card */}
      <Card 
        className="mb-6 cursor-pointer hover:shadow-card transition-all animate-fade-up animation-delay-100"
        onClick={() => setIsPosting(true)}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-muted-foreground">What's on your mind? Share with the community...</p>
          </div>
          <Send className="h-5 w-5 text-primary" />
        </CardContent>
      </Card>

      {/* Safety Banner */}
      <Card className="mb-4 bg-sage-100 border-sage-200 animate-fade-up animation-delay-150">
        <CardContent className="flex items-center gap-3 p-3">
          <Shield className="h-4 w-4 text-primary flex-shrink-0" />
          <p className="text-xs text-foreground">
            This is a safe, supportive space. Be kind and respect everyone's journey.
          </p>
        </CardContent>
      </Card>

      {/* Topic Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 animate-fade-up animation-delay-200">
        {topics.map((topic) => (
          <Button
            key={topic.name}
            variant={selectedTopic === topic.name ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTopic(topic.name)}
            className="whitespace-nowrap"
          >
            {topic.name}
            <span className="ml-1 text-xs opacity-70">{topic.count}</span>
          </Button>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-4 animate-fade-up animation-delay-300">
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No posts yet. Be the first to share!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id}>
              <CardContent className="p-4">
                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                    post.isAnonymous ? "bg-muted" : "bg-primary/20"
                  }`}>
                    {post.isAnonymous ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <span className="text-sm font-medium text-primary">
                        {post.author[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{post.author}</p>
                    <p className="text-xs text-muted-foreground">{post.timeAgo}</p>
                  </div>
                </div>

                {/* Content */}
                <p className="text-foreground mb-3">{post.content}</p>

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {post.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1 text-sm transition-colors ${
                        likedPosts.includes(post.id)
                          ? "text-terracotta-400"
                          : "text-muted-foreground hover:text-terracotta-400"
                      }`}
                    >
                      <Heart className={`h-4 w-4 ${likedPosts.includes(post.id) ? "fill-current" : ""}`} />
                      {post.likes}
                    </button>
                    <button className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
                      <MessageCircle className="h-4 w-4" />
                      {post.comments}
                    </button>
                  </div>
                  {user && post.userId === user.id && (
                    <button
                      onClick={() => deletePost(post.id)}
                      className="text-sm text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* New Post Modal */}
      {isPosting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg rounded-b-none animate-slide-in-right pb-20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-primary" />
                Share with the community
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="What's on your mind? Share a win, ask for support, or just vent..."
                className="min-h-[120px]"
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
              />

              {/* Anonymous Toggle */}
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

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsPosting(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  variant="calm"
                  className="flex-1"
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
    </div>
  );
};

export default Community;