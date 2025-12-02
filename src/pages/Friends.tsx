import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserPlus, Users } from "lucide-react";

interface ProfileRow {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
}

type FriendRequestStatus = "pending" | "accepted" | "declined" | "blocked";

interface FriendshipRow {
  id: string;
  requester_profile_id: string;
  addressee_profile_id: string;
  status: FriendRequestStatus;
  created_at: string;
  accepted_at: string | null;
}

interface FriendRequest {
  friendshipId: string;
  fromProfile: ProfileRow;
  createdAt: string;
}

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores are allowed");

const Friends = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [savingUsername, setSavingUsername] = useState(false);
  const [sendingRequest, setSendingRequest] = useState(false);
  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [friendUsername, setFriendUsername] = useState("");
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<ProfileRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfileAndFriends = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);

    try {
      const { data: profileRow, error: profileError } = await supabase
        .from("profiles")
        .select("id, user_id, username, display_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) throw profileError;

      if (!profileRow) {
        toast({
          title: "Profile not found",
          description: "We couldn't find your profile. Try signing out and back in.",
          variant: "destructive",
        });
        return;
      }

      const typedProfile = profileRow as ProfileRow;
      setProfile(typedProfile);
      setUsernameInput(typedProfile.username ?? "");

      // Load pending friend requests where current user is the addressee
      const { data: pendingFriendships, error: pendingError } = await supabase
        .from("friendships")
        .select("id, requester_profile_id, addressee_profile_id, status, created_at, accepted_at")
        .eq("addressee_profile_id", typedProfile.id)
        .eq("status", "pending")
        .order("created_at", { ascending: false });

      if (pendingError) throw pendingError;

      const requesterIds = (pendingFriendships ?? []).map((f) => f.requester_profile_id);
      let requestProfilesMap: Record<string, ProfileRow> = {};

      if (requesterIds.length > 0) {
        const { data: requesterProfiles, error: requesterError } = await supabase
          .from("profiles")
          .select("id, user_id, username, display_name")
          .in("id", requesterIds);

        if (requesterError) throw requesterError;

        requestProfilesMap = (requesterProfiles ?? []).reduce((acc, p) => {
          acc[p.id] = p as ProfileRow;
          return acc;
        }, {} as Record<string, ProfileRow>);
      }

      const formattedRequests: FriendRequest[] = (pendingFriendships ?? [])
        .map((f: any) => ({
          friendshipId: f.id as string,
          fromProfile: requestProfilesMap[f.requester_profile_id as string],
          createdAt: f.created_at as string,
        }))
        .filter((r) => r.fromProfile);

      setFriendRequests(formattedRequests);

      // Load accepted friendships where current user is either side
      const { data: asRequester, error: asRequesterError } = await supabase
        .from("friendships")
        .select("id, requester_profile_id, addressee_profile_id, status, created_at, accepted_at")
        .eq("requester_profile_id", typedProfile.id)
        .eq("status", "accepted");

      if (asRequesterError) throw asRequesterError;

      const { data: asAddressee, error: asAddresseeError } = await supabase
        .from("friendships")
        .select("id, requester_profile_id, addressee_profile_id, status, created_at, accepted_at")
        .eq("addressee_profile_id", typedProfile.id)
        .eq("status", "accepted");

      if (asAddresseeError) throw asAddresseeError;

      const friendProfileIds = [
        ...(asRequester ?? []).map((f) => f.addressee_profile_id as string),
        ...(asAddressee ?? []).map((f) => f.requester_profile_id as string),
      ];

      const uniqueFriendProfileIds = Array.from(new Set(friendProfileIds));

      let friendProfiles: ProfileRow[] = [];
      if (uniqueFriendProfileIds.length > 0) {
        const { data: friendProfilesData, error: friendsError } = await supabase
          .from("profiles")
          .select("id, user_id, username, display_name")
          .in("id", uniqueFriendProfileIds);

        if (friendsError) throw friendsError;
        friendProfiles = (friendProfilesData ?? []) as ProfileRow[];
      }

      setFriends(friendProfiles);
    } catch (error: any) {
      console.error("Error loading friends:", error);
      toast({
        title: "Something went wrong",
        description: "We couldn't load your friends right now. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, toast]);

  useEffect(() => {
    if (user) {
      loadProfileAndFriends();
    }
  }, [user, loadProfileAndFriends]);

  const handleSaveUsername = async () => {
    if (!profile) return;

    const parsed = usernameSchema.safeParse(usernameInput.trim());
    if (!parsed.success) {
      toast({
        title: "Invalid username",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }

    setSavingUsername(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({ username: parsed.data })
        .eq("id", profile.id)
        .select("id, user_id, username, display_name")
        .maybeSingle();

      if (error) {
        if (error.message.includes("duplicate") || error.message.includes("already exists")) {
          toast({
            title: "Username taken",
            description: "That username is already in use. Try another one.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data) {
        const updated = data as ProfileRow;
        setProfile(updated);
        toast({
          title: "Username saved",
          description: "Friends can now find you by your username.",
        });
      }
    } catch (error: any) {
      console.error("Error saving username:", error);
      toast({
        title: "Couldn't save username",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!profile) return;

    const targetUsername = friendUsername.trim();
    const parsed = usernameSchema.safeParse(targetUsername);
    if (!parsed.success) {
      toast({
        title: "Invalid username",
        description: parsed.error.errors[0]?.message,
        variant: "destructive",
      });
      return;
    }

    if (profile.username && profile.username.toLowerCase() === targetUsername.toLowerCase()) {
      toast({
        title: "You can't add yourself",
        description: "Try sending a request to someone else instead.",
        variant: "destructive",
      });
      return;
    }

    setSendingRequest(true);
    try {
      const { data: targetProfile, error: targetError } = await supabase
        .from("profiles")
        .select("id, user_id, username, display_name")
        .ilike("username", targetUsername)
        .maybeSingle();

      if (targetError) throw targetError;

      if (!targetProfile) {
        toast({
          title: "User not found",
          description: "We couldn't find anyone with that username.",
          variant: "destructive",
        });
        return;
      }

      // Check if friendship already exists in either direction
      const { data: existing, error: existingError } = await supabase
        .from("friendships")
        .select("id, status, requester_profile_id, addressee_profile_id")
        .or(
          `and(requester_profile_id.eq.${profile.id},addressee_profile_id.eq.${targetProfile.id}),` +
            `and(requester_profile_id.eq.${targetProfile.id},addressee_profile_id.eq.${profile.id})`
        )
        .maybeSingle();

      if (existingError && existingError.code !== "PGRST116") {
        // PGRST116 = Results contain 0 rows
        throw existingError;
      }

      if (existing) {
        if (existing.status === "pending") {
          toast({
            title: "Request already pending",
            description: "There's already a friend request between you.",
          });
        } else if (existing.status === "accepted") {
          toast({
            title: "Already friends",
            description: "You're already connected with this person.",
          });
        } else {
          toast({
            title: "Request exists",
            description: "There's already a previous request between you. Try again later.",
          });
        }
        return;
      }

      const { error: insertError } = await supabase.from("friendships").insert({
        requester_profile_id: profile.id,
        addressee_profile_id: (targetProfile as any).id,
        status: "pending",
      });

      if (insertError) {
        if (insertError.message.includes("unique") || insertError.message.includes("duplicate")) {
          toast({
            title: "Request already sent",
            description: "There's already a friend request between you.",
            variant: "destructive",
          });
        } else {
          throw insertError;
        }
        return;
      }

      setFriendUsername("");
      toast({
        title: "Friend request sent",
        description:
          "Your request has been sent to " +
          ((targetProfile as any).username || "that user") +
          ".",
      });
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      toast({
        title: "Couldn't send request",
        description: "Please double-check the username and try again.",
        variant: "destructive",
      });
    } finally {
      setSendingRequest(false);
      loadProfileAndFriends();
    }
  };

  const handleRespondToRequest = async (friendshipId: string, action: "accept" | "decline") => {
    try {
      const update: Partial<FriendshipRow> =
        action === "accept"
          ? { status: "accepted", accepted_at: new Date().toISOString() }
          : { status: "declined" };

      const { error } = await supabase
        .from("friendships")
        .update(update)
        .eq("id", friendshipId);

      if (error) throw error;

      toast({
        title: action === "accept" ? "Friend added" : "Request declined",
      });

      loadProfileAndFriends();
    } catch (error: any) {
      console.error("Error updating friend request:", error);
      toast({
        title: "Couldn't update request",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const initialsForProfile = (p: ProfileRow) => {
    const name = p.display_name || p.username || "Friend";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-muted/30 to-background pb-24">
      <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pt-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Friends</h1>
          <p className="text-sm text-muted-foreground">
            Add friends by username, manage requests, and see your trusted circle.
          </p>
        </header>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-primary" />
              Your username
            </CardTitle>
            <CardDescription>
              Choose a username so friends can send you requests.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. calm_social_ally"
                className="sm:max-w-xs"
              />
              <Button
                type="button"
                variant="calm"
                onClick={handleSaveUsername}
                disabled={savingUsername || !usernameInput.trim()}
              >
                {savingUsername && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save username
              </Button>
            </div>
            {profile?.username && (
              <p className="text-xs text-muted-foreground">
                Share this with friends: {" "}
                <span className="font-medium text-primary">@{profile.username}</span>
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <UserPlus className="h-4 w-4 text-primary" />
              Add a friend
            </CardTitle>
            <CardDescription>
              Send a gentle request using their username.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              value={friendUsername}
              onChange={(e) => setFriendUsername(e.target.value)}
              placeholder="Friend's username"
              className="sm:max-w-xs"
            />
            <Button
              type="button"
              variant="default"
              onClick={handleSendFriendRequest}
              disabled={sendingRequest || !friendUsername.trim()}
            >
              {sendingRequest && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send request
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Friend requests</CardTitle>
              <CardDescription>
                Respond to people who want to connect with you.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && !refreshing ? (
                <p className="text-sm text-muted-foreground">Loading requests...</p>
              ) : friendRequests.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You don&apos;t have any pending friend requests yet.
                </p>
              ) : (
                <ul className="space-y-3">
                  {friendRequests.map((request) => (
                    <li
                      key={request.friendshipId}
                      className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {initialsForProfile(request.fromProfile)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {request.fromProfile.display_name ||
                              request.fromProfile.username ||
                              "Friend"}
                          </p>
                          {request.fromProfile.username && (
                            <p className="text-xs text-muted-foreground">
                              @{request.fromProfile.username}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleRespondToRequest(request.friendshipId, "decline")
                          }
                        >
                          Decline
                        </Button>
                        <Button
                          size="sm"
                          variant="calm"
                          onClick={() =>
                            handleRespondToRequest(request.friendshipId, "accept")
                          }
                        >
                          Accept
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-card">
            <CardHeader>
              <CardTitle className="text-base">Your friends</CardTitle>
              <CardDescription>
                People you&apos;ve chosen to keep close in your journey.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {loading && !refreshing ? (
                <p className="text-sm text-muted-foreground">Loading friends...</p>
              ) : friends.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  You haven&apos;t added any friends yet. Start by sending a request.
                </p>
              ) : (
                <ul className="space-y-3">
                  {friends.map((friend) => (
                    <li
                      key={friend.id}
                      className="flex items-center gap-3 rounded-xl bg-muted/60 p-3"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initialsForProfile(friend)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {friend.display_name || friend.username || "Friend"}
                        </p>
                        {friend.username && (
                          <p className="text-xs text-muted-foreground">
                            @{friend.username}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={loadProfileAndFriends}
            disabled={refreshing}
          >
            {refreshing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Refresh
          </Button>
        </div>
      </section>
    </main>
  );
};

export default Friends;
