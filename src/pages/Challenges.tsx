import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Target, 
  Check, 
  ChevronRight, 
  Sparkles,
  Clock,
  Award
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
  category: string;
  tips: string[];
  completed?: boolean;
}

const challenges: Challenge[] = [
  {
    id: "1",
    title: "Say hi to a classmate",
    description: "Greet someone in your class or workspace with a simple 'hi' or wave.",
    difficulty: "Easy",
    points: 10,
    category: "Social",
    tips: [
      "A simple smile and 'hi' is perfect",
      "You don't need to start a conversation",
      "Practice in front of a mirror first if it helps"
    ],
  },
  {
    id: "2",
    title: "Ask for directions",
    description: "Ask a stranger for directions, even if you know the way.",
    difficulty: "Easy",
    points: 15,
    category: "Social",
    tips: [
      "Start with 'Excuse me...'",
      "Thank them regardless of their response",
      "Remember: most people like being helpful"
    ],
  },
  {
    id: "3",
    title: "Join a group conversation",
    description: "Listen and add one comment to a group conversation.",
    difficulty: "Medium",
    points: 25,
    category: "Social",
    tips: [
      "Listen first, then contribute when you have something to add",
      "A simple 'I agree' or question is enough",
      "You don't need to be the center of attention"
    ],
  },
  {
    id: "4",
    title: "Share an opinion in class/meeting",
    description: "Raise your hand or speak up to share a thought during a discussion.",
    difficulty: "Hard",
    points: 40,
    category: "Professional",
    tips: [
      "Write your point down beforehand",
      "Start with 'I think...' or 'In my opinion...'",
      "It's okay if your voice shakes - keep going"
    ],
  },
  {
    id: "5",
    title: "Compliment someone",
    description: "Give a genuine compliment to someone you know or a stranger.",
    difficulty: "Medium",
    points: 20,
    category: "Social",
    tips: [
      "Be specific: 'I like your jacket' works great",
      "Keep it brief - you don't need a response",
      "Sincere compliments make people's day"
    ],
  },
];

const difficultyColors = {
  Easy: "bg-sage-100 text-sage-600",
  Medium: "bg-cream-300 text-foreground",
  Hard: "bg-terracotta-100 text-terracotta-400",
};

const Challenges = () => {
  const { user } = useAuth();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<string>("all");

  // Load completed challenges from database
  useEffect(() => {
    const loadCompletedChallenges = async () => {
      if (!user) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('completed_challenges')
        .eq('user_id', user.id)
        .single();
      
      if (data?.completed_challenges) {
        setCompletedIds(data.completed_challenges);
      }
    };

    loadCompletedChallenges();
  }, [user]);

  // Save completed challenges to database
  const saveCompletedChallenges = async (newCompletedIds: string[]) => {
    if (!user) return;
    
    await supabase
      .from('profiles')
      .update({ completed_challenges: newCompletedIds })
      .eq('user_id', user.id);
  };

  const filteredChallenges = challenges.filter(c => {
    if (filter === "all") return true;
    if (filter === "completed") return completedIds.includes(c.id);
    if (filter === "todo") return !completedIds.includes(c.id);
    return c.difficulty.toLowerCase() === filter;
  });

  const toggleChallenge = (id: string) => {
    const newCompletedIds = completedIds.includes(id)
      ? completedIds.filter(cId => cId !== id)
      : [...completedIds, id];
    
    setCompletedIds(newCompletedIds);
    saveCompletedChallenges(newCompletedIds);
  };

  const completeChallenge = (id: string) => {
    if (!completedIds.includes(id)) {
      const newCompletedIds = [...completedIds, id];
      setCompletedIds(newCompletedIds);
      saveCompletedChallenges(newCompletedIds);
    }
    setSelectedChallenge(null);
  };

  const totalPoints = completedIds.reduce((sum, id) => {
    const challenge = challenges.find(c => c.id === id);
    return sum + (challenge?.points || 0);
  }, 0);

  return (
    <div className="gradient-hero min-h-screen px-6 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2 mb-1">
          <Target className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">Challenges</h1>
        </div>
        <p className="text-muted-foreground">
          Small steps lead to big changes
        </p>
      </div>

      {/* Stats */}
      <Card className="mb-6 animate-fade-up animation-delay-100">
        <CardContent className="flex items-center justify-around p-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-primary">
              <Check className="h-4 w-4" />
              <span className="text-xl font-bold">{completedIds.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Completed</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-accent">
              <Award className="h-4 w-4" />
              <span className="text-xl font-bold">{totalPoints}</span>
            </div>
            <p className="text-xs text-muted-foreground">Points</p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-terracotta-400">
              <Clock className="h-4 w-4" />
              <span className="text-xl font-bold">{challenges.length - completedIds.length}</span>
            </div>
            <p className="text-xs text-muted-foreground">Remaining</p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 animate-fade-up animation-delay-200">
        {["all", "easy", "medium", "hard", "completed"].map((f) => (
          <Button
            key={f}
            variant={filter === f ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize whitespace-nowrap"
          >
            {f}
          </Button>
        ))}
      </div>

      {/* Challenge List */}
      <div className="space-y-3 animate-fade-up animation-delay-300">
        {filteredChallenges.map((challenge) => {
          const isCompleted = completedIds.includes(challenge.id);
          return (
            <Card
              key={challenge.id}
              className={`transition-all ${
                isCompleted ? "opacity-60" : "hover:shadow-card"
              }`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <Checkbox
                  checked={isCompleted}
                  onCheckedChange={() => toggleChallenge(challenge.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-6 w-6 rounded-full border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                />
                <div className="flex-1" onClick={() => !isCompleted && setSelectedChallenge(challenge)}>
                  <p className={`font-semibold ${isCompleted ? "line-through text-muted-foreground" : ""}`}>
                    {challenge.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={difficultyColors[challenge.difficulty]}>
                      {challenge.difficulty}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      +{challenge.points} pts
                    </span>
                  </div>
                </div>
                {!isCompleted && (
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg rounded-b-none animate-slide-in-right">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <CardTitle>{selectedChallenge.title}</CardTitle>
              </div>
              <Badge className={difficultyColors[selectedChallenge.difficulty]}>
                {selectedChallenge.difficulty} • +{selectedChallenge.points} pts
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                {selectedChallenge.description}
              </p>

              <div className="rounded-xl bg-muted p-4">
                <p className="font-semibold mb-2">💡 Tips for success</p>
                <ul className="space-y-2">
                  {selectedChallenge.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="text-primary">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setSelectedChallenge(null)}
                >
                  Not Now
                </Button>
                <Button
                  variant="calm"
                  className="flex-1"
                  onClick={() => completeChallenge(selectedChallenge.id)}
                >
                  Mark Complete
                  <Check className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Challenges;
