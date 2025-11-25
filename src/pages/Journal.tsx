import { useState } from "react";
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
  ChevronRight,
  Check,
  Sparkles
} from "lucide-react";

interface JournalEntry {
  id: string;
  date: string;
  mood: "good" | "okay" | "tough";
  content: string;
  reflection?: string;
}

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

const sampleEntries: JournalEntry[] = [
  {
    id: "1",
    date: "2024-01-15",
    mood: "good",
    content: "Had a really good day! Said hi to someone new in class and they smiled back. Small win but it felt huge.",
    reflection: "I'm grateful for my friend Sarah who always makes me feel comfortable.",
  },
  {
    id: "2",
    date: "2024-01-14",
    mood: "okay",
    content: "Today was okay. Felt nervous before the meeting but used the breathing exercise and it helped. Didn't speak up but I stayed through the whole thing.",
  },
  {
    id: "3",
    date: "2024-01-13",
    mood: "tough",
    content: "Tough day. Avoided going to lunch with coworkers. Feeling frustrated with myself but trying to remember it's okay to have hard days.",
    reflection: "Tomorrow is a new day. I can try again.",
  },
];

const Journal = () => {
  const [entries, setEntries] = useState<JournalEntry[]>(sampleEntries);
  const [isWriting, setIsWriting] = useState(false);
  const [newEntry, setNewEntry] = useState({ mood: "" as JournalEntry["mood"] | "", content: "", reflection: "" });
  const [currentPrompt] = useState(reflectionPrompts[Math.floor(Math.random() * reflectionPrompts.length)]);

  const saveEntry = () => {
    if (!newEntry.mood || !newEntry.content) return;

    const entry: JournalEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split("T")[0],
      mood: newEntry.mood as JournalEntry["mood"],
      content: newEntry.content,
      reflection: newEntry.reflection || undefined,
    };

    setEntries([entry, ...entries]);
    setNewEntry({ mood: "", content: "", reflection: "" });
    setIsWriting(false);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (dateStr === today.toISOString().split("T")[0]) return "Today";
    if (dateStr === yesterday.toISOString().split("T")[0]) return "Yesterday";
    
    return date.toLocaleDateString("en-US", { 
      weekday: "short", 
      month: "short", 
      day: "numeric" 
    });
  };

  const getMoodIcon = (mood: JournalEntry["mood"]) => {
    const option = moodOptions.find(o => o.value === mood);
    return option ? <option.icon className="h-5 w-5" /> : null;
  };

  const getMoodColor = (mood: JournalEntry["mood"]) => {
    const option = moodOptions.find(o => o.value === mood);
    return option?.color || "";
  };

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
          <Card className="mb-6 bg-primary/5 border-primary/20 animate-fade-up animation-delay-100">
            <CardContent className="flex items-center gap-4 p-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="font-semibold">7 day streak! 🔥</p>
                <p className="text-sm text-muted-foreground">
                  You've been journaling consistently
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Entries */}
          <div className="space-y-4 animate-fade-up animation-delay-200">
            {entries.map((entry) => (
              <Card key={entry.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {formatDate(entry.date)}
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
            ))}
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
            disabled={!newEntry.mood || !newEntry.content}
          >
            Save Entry
            <Check className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Journal;
