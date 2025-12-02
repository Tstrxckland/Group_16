import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Users, 
  MessageCircle, 
  Heart, 
  Send,
  EyeOff,
  Shield,
  ChevronRight,
  Plus
} from "lucide-react";

interface Post {
  id: string;
  author: string;
  isAnonymous: boolean;
  content: string;
  likes: number;
  comments: number;
  timeAgo: string;
  tags: string[];
}

const samplePosts: Post[] = [
  {
    id: "1",
    author: "Anonymous",
    isAnonymous: true,
    content: "Had my first successful phone call with a stranger today! It was just to order food but I've been avoiding phone calls for months. Baby steps! 🎉",
    likes: 24,
    comments: 8,
    timeAgo: "2h ago",
    tags: ["win", "phone-anxiety"],
  },
  {
    id: "2",
    author: "Maya",
    isAnonymous: false,
    content: "Does anyone else rehearse conversations in their head before they happen? I spent 20 minutes preparing to ask my professor a question today 😅",
    likes: 47,
    comments: 15,
    timeAgo: "4h ago",
    tags: ["relatable", "college"],
  },
  {
    id: "3",
    author: "Anonymous",
    isAnonymous: true,
    content: "Reminder to everyone here: It's okay to leave a party early. It's okay to not go at all. Your mental health matters more than others' expectations. 💚",
    likes: 89,
    comments: 12,
    timeAgo: "6h ago",
    tags: ["support", "reminder"],
  },
  {
    id: "4",
    author: "Jordan",
    isAnonymous: false,
    content: "The breathing exercises on this app actually helped me today before a big meeting. I still felt nervous but I didn't spiral. Progress!",
    likes: 31,
    comments: 6,
    timeAgo: "1d ago",
    tags: ["win", "work"],
  },
];

const topics = [
  { name: "All", count: 156 },
  { name: "Wins", count: 43 },
  { name: "Support", count: 67 },
  { name: "College", count: 28 },
  { name: "Work", count: 18 },
];

const Community = () => {
  const [posts, setPosts] = useState<Post[]>(samplePosts);
  const [selectedTopic, setSelectedTopic] = useState("All");
  const [isPosting, setIsPosting] = useState(false);
  const [newPost, setNewPost] = useState("");
  const [postAnonymously, setPostAnonymously] = useState(true);
  const [likedPosts, setLikedPosts] = useState<string[]>([]);

  const toggleLike = (postId: string) => {
    if (likedPosts.includes(postId)) {
      setLikedPosts(likedPosts.filter(id => id !== postId));
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes - 1 } : p));
    } else {
      setLikedPosts([...likedPosts, postId]);
      setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.likes + 1 } : p));
    }
  };

  const submitPost = () => {
    if (!newPost.trim()) return;

    const post: Post = {
      id: Date.now().toString(),
      author: postAnonymously ? "Anonymous" : "You",
      isAnonymous: postAnonymously,
      content: newPost,
      likes: 0,
      comments: 0,
      timeAgo: "Just now",
      tags: [],
    };

    setPosts([post, ...posts]);
    setNewPost("");
    setIsPosting(false);
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
        {posts.map((post) => (
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
            </CardContent>
          </Card>
        ))}
      </div>

      {/* New Post Modal */}
      {isPosting && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg rounded-b-none animate-slide-in-right">
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
                >
                  Cancel
                </Button>
                <Button
                  variant="calm"
                  className="flex-1"
                  onClick={submitPost}
                  disabled={!newPost.trim()}
                >
                  Post
                  <Send className="h-4 w-4" />
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
