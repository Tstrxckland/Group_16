import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Flame, 
  Target, 
  Heart, 
  TrendingUp, 
  ChevronRight,
  Sun,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";
import { useDiscreetMode } from "@/hooks/useDiscreetMode";

const Dashboard = () => {
  const { discreetMode } = useDiscreetMode();
  const currentStreak = 7;
  const weeklyProgress = 65;
  const todayChallenge = {
    title: discreetMode ? "Greet someone you recognize" : "Say hi to a classmate",
    difficulty: "Easy",
    points: 10,
  };

  const quickStats = [
    { label: "Current Streak", value: `${currentStreak} days`, icon: Flame, color: "text-terracotta-400" },
    { label: "Challenges Done", value: "12", icon: Target, color: "text-primary" },
    { label: "Confidence Score", value: "72%", icon: TrendingUp, color: "text-accent" },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="gradient-hero min-h-screen px-6 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-up">
        <div className="flex items-center gap-2 text-muted-foreground mb-1">
          <Sun className="h-4 w-4" />
          <span className="text-sm">{getGreeting()}</span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground">
          {discreetMode ? "Welcome back" : "Welcome back! 🌿"}
        </h1>
        <p className="text-muted-foreground mt-1">
          {discreetMode
            ? "Overview of your recent activity."
            : "You're doing great. Every step counts."}
        </p>
      </div>

      {/* Weekly Progress */}
      <Card className="mb-6 animate-fade-up animation-delay-100">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Weekly Progress</CardTitle>
            <span className="text-sm font-semibold text-primary">{weeklyProgress}%</span>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={weeklyProgress} className="h-3 mb-3" />
          <p className="text-sm text-muted-foreground">
            {discreetMode
              ? "4 of 6 challenges completed this week."
              : "You've completed 4 of 6 challenges this week. Keep going!"}
          </p>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up animation-delay-200">
        {quickStats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="p-4">
              <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-lg font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Today's Challenge */}
      <Card className="mb-6 border-primary/30 bg-primary/5 animate-fade-up animation-delay-300">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Today's Challenge</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold text-foreground">{todayChallenge.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-medium text-primary">
                  {todayChallenge.difficulty}
                </span>
                <span className="text-sm text-muted-foreground">
                  +{todayChallenge.points} pts
                </span>
              </div>
            </div>
          </div>
          <Link to="/challenges">
            <Button variant="calm" className="w-full">
              Start Challenge
              <ChevronRight className="h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* SOS Button */}
      <Link to="/calm">
        <Card className="mb-6 cursor-pointer bg-terracotta-100 border-terracotta-200 hover:shadow-card transition-all animate-fade-up animation-delay-400">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-terracotta-200">
                <Heart className="h-6 w-6 text-terracotta-400 animate-pulse-soft" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {discreetMode ? "Calm tools" : "Need a moment?"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {discreetMode
                    ? "Access quick breathing and relaxation exercises."
                    : "Quick calming exercises"}
                </p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      </Link>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 animate-fade-up animation-delay-500">
        <Link to="/journal">
          <Card className="cursor-pointer hover:shadow-card transition-all h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl mb-2">📝</span>
              <p className="font-semibold">Journal</p>
              <p className="text-xs text-muted-foreground">
                {discreetMode ? "Write about your day" : "Reflect on today"}
              </p>
            </CardContent>
          </Card>
        </Link>
        <Link to="/community">
          <Card className="cursor-pointer hover:shadow-card transition-all h-full">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <span className="text-3xl mb-2">💬</span>
              <p className="font-semibold">Community</p>
              <p className="text-xs text-muted-foreground">
                {discreetMode ? "View community posts" : "Connect with others"}
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
};

export default Dashboard;
