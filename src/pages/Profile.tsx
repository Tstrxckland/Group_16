import { useState, useEffect, useCallback } from "react";
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
  ExternalLink,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  id: string;
  display_name: string | null;
  is_anonymous: boolean;
}

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, is_anonymous")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    if (data) {
      setProfile(data);
      setIsAnonymous(data.is_anonymous);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleAnonymousToggle = async (checked: boolean) => {
    setIsAnonymous(checked);
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ is_anonymous: checked })
      .eq("id", profile.id);

    if (error) {
      console.error("Error updating anonymous mode:", error);
      toast({
        title: "Couldn't save preference",
        description: "Please try again.",
        variant: "destructive",
      });
      setIsAnonymous(!checked); // revert
    }
  };

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
                <span className="text-2xl font-bold text-primary">
                  {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {isAnonymous ? "Anonymous User" : (profile?.display_name || user?.email?.split("@")[0] || "User")}
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
            <Switch checked={isAnonymous} onCheckedChange={handleAnonymousToggle} />
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
              role="button"
              tabIndex={0}
              onClick={() => {
                if (resource.name === "Crisis Support Lines") {
                  window.open("https://findahelpline.com", "_blank", "noopener,noreferrer");
                }
              }}
              onKeyDown={(e) => {
                if (
                  (e.key === "Enter" || e.key === " ") &&
                  resource.name === "Crisis Support Lines"
                ) {
                  e.preventDefault();
                  window.open("https://findahelpline.com", "_blank", "noopener,noreferrer");
                }
              }}
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
        className="w-full mb-2"
        onClick={async () => {
          await signOut();
          toast({
            title: "Signed out",
            description: "You've been signed out successfully.",
          });
          navigate("/");
        }}
      >
        <LogOut className="h-4 w-4" />
        Sign Out
      </Button>

      <Button
        variant="outline"
        className="w-full mb-4 text-destructive border-destructive/40 hover:bg-destructive/10"
        onClick={async () => {
          const confirmed = window.confirm(
            "Are you sure you want to permanently delete your account? This cannot be undone.",
          );

          if (!confirmed) return;

          const { error } = await supabase.functions.invoke("delete-account");

          if (error) {
            console.error("Error deleting account", error);
            toast({
              title: "Error deleting account",
              description:
                "Something went wrong while deleting your account. Please try again.",
              variant: "destructive",
            });
            return;
          }

          toast({
            title: "Account deleted",
            description: "Your account and data have been deleted.",
          });

          navigate("/");
        }}
      >
        Delete Account
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        SafeSpace v1.0 • Made with 💚 for you
      </p>
    </div>
  );
};

export default Profile;
