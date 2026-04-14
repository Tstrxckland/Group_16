import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  User,
  Users,
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
import { useUserStats } from "@/hooks/useUserStats";
import { useAnonymityMode } from "@/hooks/useAnonymityMode";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  id: string;
  display_name: string | null;
  is_anonymous: boolean;
  created_at: string;
  discreet_mode: boolean;
}

interface PeerDiscoveryPrivacySettings {
  discoverableInPeerSearch: boolean;
  allowDirectFriendRequests: boolean;
  showDisplayNameInDiscovery: boolean;
  showProgressSignals: boolean;
}

const PEER_DISCOVERY_PRIVACY_KEY = "peer-discovery-privacy-settings";

const defaultPeerDiscoveryPrivacy: PeerDiscoveryPrivacySettings = {
  discoverableInPeerSearch: true,
  allowDirectFriendRequests: true,
  showDisplayNameInDiscovery: false,
  showProgressSignals: false,
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const { completedChallenges, journalEntries, journalStreak } = useUserStats();
  const {
    anonymityEnabled,
    loading: anonymityLoading,
    setAnonymityEnabled,
  } = useAnonymityMode();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [savingAnonymous, setSavingAnonymous] = useState(false);
  const [savingIdentitySafeMode, setSavingIdentitySafeMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [peerDiscoveryPrivacy, setPeerDiscoveryPrivacy] = useState<PeerDiscoveryPrivacySettings>(
    defaultPeerDiscoveryPrivacy
  );

  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, display_name, is_anonymous, created_at, discreet_mode")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading profile:", error);
      return;
    }

    if (data) {
      const typed = data as ProfileData;
      setProfile(typed);
      setPrivacyMode(typed.discreet_mode);
    }
  }, [user]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PEER_DISCOVERY_PRIVACY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<PeerDiscoveryPrivacySettings>;
      setPeerDiscoveryPrivacy((prev) => ({
        ...prev,
        ...parsed,
      }));
    } catch (error) {
      console.error("Error loading peer discovery privacy settings:", error);
    }
  }, []);

  const updatePeerDiscoveryPrivacy = (
    key: keyof PeerDiscoveryPrivacySettings,
    value: boolean
  ) => {
    setPeerDiscoveryPrivacy((prev) => {
      const next: PeerDiscoveryPrivacySettings = {
        ...prev,
        [key]: value,
      };

      localStorage.setItem(PEER_DISCOVERY_PRIVACY_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleAnonymousToggle = async (checked: boolean) => {
    if (!profile) {
      toast({
        title: "Profile not loaded",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    setSavingAnonymous(true);

    const { error } = await setAnonymityEnabled(checked);

    if (error) {
      console.error("Error updating anonymous mode:", error);
      toast({
        title: "Couldn't save preference",
        description: "Please try again.",
        variant: "destructive",
      });
    }

    setSavingAnonymous(false);
  };

  const handlePrivacyToggle = async (checked: boolean) => {
    setPrivacyMode(checked);
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ discreet_mode: checked })
      .eq("id", profile.id);

    if (error) {
      console.error("Error updating discreet mode:", error);
      toast({
        title: "Couldn't save preference",
        description: "Please try again.",
        variant: "destructive",
      });
      setPrivacyMode(!checked); // revert
    }
  };

  const handleIdentitySafePreset = async () => {
    if (!profile) {
      toast({
        title: "Profile not loaded",
        description: "Please wait a moment and try again.",
        variant: "destructive",
      });
      return;
    }

    const prevAnonymous = anonymityEnabled;
    const prevDiscreet = privacyMode;

    setSavingIdentitySafeMode(true);

    try {
      const { error: anonymityError } = await setAnonymityEnabled(true);
      if (anonymityError) throw anonymityError;

      setPrivacyMode(true);
      const { error: discreetError } = await supabase
        .from("profiles")
        .update({ discreet_mode: true })
        .eq("id", profile.id);
      if (discreetError) throw discreetError;

      toast({
        title: "Identity-safe mode enabled",
        description: "Your profile is now anonymous and discreet mode is on.",
      });
    } catch (error) {
      console.error("Error enabling identity-safe mode:", error);
      toast({
        title: "Couldn't enable identity-safe mode",
        description: "Please try again.",
        variant: "destructive",
      });
      setPrivacyMode(prevDiscreet);
      await setAnonymityEnabled(prevAnonymous);
    }

    setSavingIdentitySafeMode(false);
  };

  const confidenceScore = Math.min(
    completedChallenges * 5 + journalEntries * 2 + journalStreak * 3,
    100
  );

  const stats = [
    { label: "Day Streak", value: journalStreak, icon: Flame, color: "text-terracotta-400" },
    { label: "Challenges", value: completedChallenges, icon: Target, color: "text-primary" },
    { label: "Journal Entries", value: journalEntries, icon: BookHeart, color: "text-accent" },
  ];

  const achievements = [
    { name: "First Step", description: "Completed your first challenge", earned: completedChallenges >= 1 },
    { name: "Week Warrior", description: "7-day streak", earned: journalStreak >= 7 },
    { name: "Voice Found", description: "Shared in community", earned: false },
    { name: "Breath Master", description: "Used calm tools 10 times", earned: false },
    { name: "Month Strong", description: "30-day streak", earned: journalStreak >= 30 },
  ];

  const resources = [
    { name: "Crisis Support Lines", description: "24/7 help when you need it", url: "https://findahelpline.com" },
    { name: "Anxiety Resources", description: "Articles and guides", url: "https://www.cci.health.wa.gov.au/Resources/Looking-after-yourself/anxiety" },
    { name: "Find a Therapist", description: "Professional support", url: "https://www.betterhelp.com" },
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
              {anonymityEnabled ? (
                <EyeOff className="h-8 w-8 text-primary" />
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {(profile?.display_name || user?.email || "U")[0].toUpperCase()}
                </span>
              )}
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {anonymityEnabled
                  ? "Anonymous User"
                  : (profile?.display_name || user?.email?.split("@")[0] || "User")}
              </h2>
              <p className="text-muted-foreground">
                {profile?.created_at
                  ? `Member since ${new Date(profile.created_at).getFullYear()}`
                  : "Member since"}
              </p>
            </div>
          </div>

          {/* Confidence Score */}
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">Confidence Score</span>
              <span className="font-bold text-primary">{confidenceScore}%</span>
            </div>
            <Progress value={confidenceScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {confidenceScore === 0
                ? "As you complete challenges and journal, your confidence score will grow."
                : "Keep going—your actions are steadily building confidence."}
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
              {anonymityEnabled ? (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              ) : (
                <Eye className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Profile Anonymity</p>
                <p className="text-sm text-muted-foreground">
                  {anonymityEnabled ? "You appear as Anonymous User." : "Your display name is visible."}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-muted-foreground min-w-[70px] text-right">
                {savingAnonymous ? "Saving..." : anonymityEnabled ? "Anonymous" : "Public"}
              </span>
              <Switch
                checked={anonymityEnabled}
                onCheckedChange={handleAnonymousToggle}
                disabled={savingAnonymous || anonymityLoading || !profile}
              />
            </div>
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
                <p className="text-sm text-muted-foreground">Use more neutral language in the app</p>
              </div>
            </div>
            <Switch checked={privacyMode} onCheckedChange={handlePrivacyToggle} />
          </div>
        </CardContent>
      </Card>

      {/* Identity-Safe Preset */}
      <Card className="mb-6 animate-fade-up animation-delay-350 border-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Identity-Safe Mode
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Designed for people who want extra protection from harassment or being misgendered in public spaces.
          </p>
          <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            <p>- Hides your public identity (anonymous profile display)</p>
            <p>- Enables discreet mode for neutral language in the app</p>
            <p>- Community posts default to anonymous</p>
          </div>
          <Button
            variant="outline"
            className="w-full"
            onClick={handleIdentitySafePreset}
            disabled={savingIdentitySafeMode || (anonymityEnabled && privacyMode)}
          >
            {savingIdentitySafeMode
              ? "Enabling..."
              : anonymityEnabled && privacyMode
                ? "Identity-Safe Mode Active"
                : "Enable Identity-Safe Mode"}
          </Button>
        </CardContent>
      </Card>

      {/* Peer Discovery Privacy */}
      <Card className="mb-6 animate-fade-up animation-delay-375">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Peer Discovery Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Control how you appear in peer matching and filtering spaces.
          </p>

          <div className="rounded-xl bg-muted/50 p-3 text-sm text-muted-foreground">
            Use these settings to reduce unwanted exposure while still finding supportive connections.
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Discoverable in peer search</p>
                  <p className="text-sm text-muted-foreground">
                    Let others find you in matching results.
                  </p>
                </div>
              </div>
              <Switch
                checked={peerDiscoveryPrivacy.discoverableInPeerSearch}
                onCheckedChange={(checked) =>
                  updatePeerDiscoveryPrivacy("discoverableInPeerSearch", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Show display name in discovery</p>
                  <p className="text-sm text-muted-foreground">
                    Off uses a more identity-safe anonymous label.
                  </p>
                </div>
              </div>
              <Switch
                checked={peerDiscoveryPrivacy.showDisplayNameInDiscovery}
                onCheckedChange={(checked) =>
                  updatePeerDiscoveryPrivacy("showDisplayNameInDiscovery", checked)
                }
                disabled={anonymityEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Allow direct friend requests</p>
                  <p className="text-sm text-muted-foreground">
                    Turn off to require safer, slower introductions.
                  </p>
                </div>
              </div>
              <Switch
                checked={peerDiscoveryPrivacy.allowDirectFriendRequests}
                onCheckedChange={(checked) =>
                  updatePeerDiscoveryPrivacy("allowDirectFriendRequests", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Award className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Show progress signals</p>
                  <p className="text-sm text-muted-foreground">
                    Share streaks/achievement cues in matching previews.
                  </p>
                </div>
              </div>
              <Switch
                checked={peerDiscoveryPrivacy.showProgressSignals}
                onCheckedChange={(checked) =>
                  updatePeerDiscoveryPrivacy("showProgressSignals", checked)
                }
              />
            </div>
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
                window.open(resource.url, "_blank", "noopener,noreferrer");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  window.open(resource.url, "_blank", "noopener,noreferrer");
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
