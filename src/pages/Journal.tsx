import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { 
  BookHeart, 
  Plus, 
  Calendar,
  Smile,
  Meh,
  Frown,
  Check,
  Sparkles,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { createJournalEntry, JournalEntry, listJournalEntries, Mood } from "@/services/journalService";

const moodOptions = [
  { value: "good" as const, label: "Good day", icon: Smile, color: "bg-sage-100 text-sage-600" },
  { value: "okay" as const, label: "Okay day", icon: Meh, color: "bg-cream-300 text-foreground" },
  { value: "tough" as const, label: "Tough day", icon: Frown, color: "bg-terracotta-100 text-terracotta-400" },
];

const reflectionPrompts = [
  "What's one thing you're grateful for today?",
  "What social interaction, big or small, did you have today?",
  "What made you feel anxious today? How did you handle it?",
  "What's one thing you did today that took courage?",
  "How are you feeling right now, in this moment?",
];

const Journal = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  const [newEntry, setNewEntry] = useState({ mood: "" as Mood | "", content: "", reflection: "" });
  const [currentPrompt] = useState(reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]);
  const [streak, setStreak] = useState(0);

  const loadEntries = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    try {
      const data = await listJournalEntries(user.id);
      setEntries(data);
      calculateStreak(data);
    } catch (error) {
      console.error("Error loading journal entries:", error);
      toast({
        title: "Couldn't load entries",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const calculateStreak = (entries: JournalEntry[]) => {
    if (entries.length === 0) {
      setStreak(0);
      return;
    }

    // Get unique dates (in local timezone)
    const dates = entries.map((e) => new Date(e.created_at).toDateString());
    const uniqueDates = [...new Set(dates)].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    // Check if streak is active (today or yesterday has an entry)
    if (uniqueDates[0] !== today && uniqueDates[0] !== yesterday) {
      setStreak(0);
      return;
    }

    let currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const current = new Date(uniqueDates[i - 1]);
      const prev = new Date(uniqueDates[i]);
      const diffDays = Math.round((current.getTime() - prev.getTime()) / 86400000);

      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const saveEntry = async () => {
    if (!newEntry.mood || !newEntry.content || !user) return;

    setSaving(true);

    try {
      const data = await createJournalEntry({
        userId: user.id,
        mood: newEntry.mood,
        content: newEntry.content,
        reflection: newEntry.reflection,
      });
      const newEntries = [data, ...entries];
      setEntries(newEntries);
      calculateStreak(newEntries);
      setNewEntry({ mood: "", content: "", reflection: "" });
      setIsWriting(false);
      toast({ title: "Entry saved" });
    } catch (error) {
      console.error("Error saving journal entry:", error);
      toast({
        title: "Couldn't save entry",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
    
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const getMoodIcon = (mood: Mood) => {
    const option = moodOptions.find(o => o.value === mood);
    return option ? <option.icon className="h-5 w-5" /> : null;
  };

  const getMoodColor = (mood: Mood) => {
    const option = moodOptions.find(o => o.value === mood);
    return option?.color || "";
  };

  if (!user) return null;

  return (
    <div className="gradient-hero min-h-screen px-6 py-8">
      {!isWriting ? (
        <>
          {/* Header */}
          <div className="mb-6 animate-fade-up">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookHeart className="h-5 w-5 text-primary" />
                <h1 className="font-display text-2xl font-bold">Journal</h1>
              </div>
              <Button
                variant="calm"
                size="sm"
                onClick={() => setIsWriting(true)}
              >
                <Plus className="h-4 w-4" />
                New Entry
              </Button>
            </div>
            <p className="text-muted-foreground mt-1">
              Reflect on your journey
            </p>
          </div>

          {/* Streak Card */}
          {streak > 0 && (
            <Card className="mb-6 bg-primary/5 border-primary/20 animate-fade-up animation-delay-100">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{streak} day streak!</p>
                  <p className="text-sm text-muted-foreground">
                    You've been journaling consistently
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Entries */}
          <div className="space-y-4 animate-fade-up animation-delay-200">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : entries.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <BookHeart className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    No journal entries yet. Start writing to track your journey.
                  </p>
                </CardContent>
              </Card>
            ) : (
              entries.map((entry) => (
                <Card key={entry.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {formatDate(entry.created_at)}
                      </div>
                      <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-xs ${getMoodColor(entry.mood)}`}>
                        {getMoodIcon(entry.mood)}
                        <span className="capitalize">{entry.mood}</span>
                      </div>
                    </div>
                    <p className="text-foreground mb-2">{entry.content}</p>
                    {entry.reflection && (
                      <p className="text-sm text-muted-foreground italic border-l-2 border-primary/30 pl-3">
                        {entry.reflection}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      ) : (
        /* New Entry Form */
        <div className="animate-fade-up">
          <Button
            variant="ghost"
            className="mb-6"
            onClick={() => setIsWriting(false)}
          >
            ← Back
          </Button>

          <h1 className="font-display text-2xl font-bold mb-2">
            How was your day?
          </h1>
          <p className="text-muted-foreground mb-6">
            Take a moment to reflect
          </p>

          {/* Mood Selection */}
          <div className="mb-6">
            <p className="font-medium mb-3">How are you feeling?</p>
            <div className="grid grid-cols-3 gap-3">
              {moodOptions.map((option) => (
                <Card
                  key={option.value}
                  className={`cursor-pointer text-center transition-all ${
                    newEntry.mood === option.value
                      ? "border-primary shadow-card"
                      : "hover:border-primary/30"
                  }`}
                  onClick={() => setNewEntry({ ...newEntry, mood: option.value })}
                >
                  <CardContent className="p-4">
                    <option.icon className={`h-8 w-8 mx-auto mb-2 ${
                      newEntry.mood === option.value ? "text-primary" : "text-muted-foreground"
                    }`} />
                    <p className="text-sm">{option.label}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Journal Entry */}
          <div className="mb-6">
            <p className="font-medium mb-3">What's on your mind?</p>
            <Textarea
              placeholder="Write about your day, your feelings, or anything you'd like to remember..."
              className="min-h-[120px] bg-card"
              value={newEntry.content}
              onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
            />
          </div>

          {/* Reflection Prompt */}
          <Card className="mb-6 bg-muted/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Reflection prompt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">{currentPrompt}</p>
              <Textarea
                placeholder="Your reflection..."
                className="min-h-[80px] bg-background"
                value={newEntry.reflection}
                onChange={(e) => setNewEntry({ ...newEntry, reflection: e.target.value })}
              />
            </CardContent>
          </Card>

          {/* Save Button */}
          <Button
            variant="calm"
            className="w-full"
            onClick={saveEntry}
            disabled={!newEntry.mood || !newEntry.content || saving}
          >
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Entry
            {!saving && <Check className="h-4 w-4" />}
          </Button>
        </div>
      )}
    </div>
  );
};

export default Journal;
