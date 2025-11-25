import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { 
  User, 
  Shield, 
  Bell, 
  Eye,
  EyeOff,
  Moon,
  ChevronRight,
  Award,
  Target,
  Flame,
  BookHeart,
  Settings,
  LogOut,
  ExternalLink
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  const stats = [
    { label: "Day Streak", value: 7, icon: Flame, color: "text-terracotta-400" },
    { label: "Challenges", value: 12, icon: Target, color: "text-primary" },
    { label: "Journal Entries", value: 23, icon: BookHeart, color: "text-accent" },
  ];

  const achievements = [
    { name: "First Step", description: "Completed your first challenge", earned: true },
    { name: "Week Warrior", description: "7-day streak", earned: true },
    { name: "Voice Found", description: "Shared in community", earned: true },
    { name: "Breath Master", description: "Used calm tools 10 times", earned: false },
    { name: "Month Strong", description: "30-day streak", earned: false },
  ];

  const resources = [
    { name: "Crisis Support Lines", description: "24/7 help when you need it" },
    { name: "Anxiety Resources", description: "Articles and guides" },
    { name: "Find a Therapist", description: "Professional support" },
  ];

  return (
    <div className="gradient-hero min-h-screen px-6 py-8">
      {/* Header */}
      <div className="mb-6 animate-fade-up">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl font-bold">Profile</h1>
        </div>
      </div>

      {/* Profile Card */}
      <Card className="mb-6 animate-fade-up animation-delay-100">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              {isAnonymous ? (
                <EyeOff className="h-8 w-8 text-primary" />
              ) : (
                <span className="text-2xl font-bold text-primary">M</span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isAnonymous ? "Anonymous User" : "Maya"}
              </h2>
              <p className="text-muted-foreground">Member since January 2024</p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Confidence Score</span>
              <span className="font-bold text-primary">72%</span>
            </div>
            <Progress value={72} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              +5% from last week! Keep going 🌟
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6 animate-fade-up animation-delay-200">
        {stats.map((stat) => (
          <Card key={stat.label} className="text-center">
            <CardContent className="p-4">
              <stat.icon className={`h-5 w-5 mx-auto mb-2 ${stat.color}`} />
              <p className="text-xl font-bold">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Privacy Settings */}
      <Card className="mb-6 animate-fade-up animation-delay-300">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy & Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Anonymous Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <EyeOff className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Anonymous Mode</p>
                <p className="text-sm text-muted-foreground">Hide your identity</p>
              </div>
            </div>
            <Switch checked={isAnonymous} onCheckedChange={setIsAnonymous} />
          </div>

          {/* Notifications */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Notifications</p>
                <p className="text-sm text-muted-foreground">Daily reminders</p>
              </div>
            </div>
            <Switch checked={notifications} onCheckedChange={setNotifications} />
          </div>

          {/* Privacy Mode */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Moon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Discreet Mode</p>
                <p className="text-sm text-muted-foreground">Neutral language & UI</p>
              </div>
            </div>
            <Switch checked={privacyMode} onCheckedChange={setPrivacyMode} />
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card className="mb-6 animate-fade-up animation-delay-400">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.name}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  achievement.earned ? "bg-primary/5" : "bg-muted/50 opacity-60"
                }`}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  achievement.earned ? "bg-primary/20" : "bg-muted"
                }`}>
                  <Award className={`h-5 w-5 ${achievement.earned ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <p className={`font-medium ${!achievement.earned && "text-muted-foreground"}`}>
                    {achievement.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Resources */}
      <Card className="mb-6 animate-fade-up animation-delay-500">
        <CardHeader>
          <CardTitle className="text-lg">Resources Portal</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {resources.map((resource) => (
            <div
              key={resource.name}
              className="flex items-center justify-between rounded-xl p-3 hover:bg-muted/50 cursor-pointer transition-colors"
            >
              <div>
                <p className="font-medium">{resource.name}</p>
                <p className="text-sm text-muted-foreground">{resource.description}</p>
              </div>
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full mb-4"
        onClick={() => navigate("/")}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        SafeSpace v1.0 • Made with 💚 for you
      </p>
    </div>
  );
};

export default Profile;
