import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import {
  createFriendRequest,
  findExistingFriendship,
  findProfileByUsername,
  FriendRequest,
  FriendWithFriendshipId,
  ProfileRow,
  loadFriendsDashboard,
  removeFriend,
  respondToFriendRequest,
  updateProfileUsername,
} from "@/services/friendsService";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Loader2, UserPlus, Users, MessageCircle, X, Check } from "lucide-react";
import { MessageThread } from "@/components/MessageThread";

const usernameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(20, "Username must be at most 20 characters")
  .regex(/^[a-zA-Z0-9_]+$/, "Only letters, numbers and underscores are allowed");

const getErrorMessage = (error: unknown) => (error instanceof Error ? error.message : "");

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
  const [friends, setFriends] = useState<FriendWithFriendshipId[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<{ friendshipId: string; friendName: string } | null>(null);
  const [removingFriendshipId, setRemovingFriendshipId] = useState<string | null>(null);

  const loadProfileAndFriends = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);

    try {
      const { profile: loadedProfile, friendRequests: loadedRequests, friends: loadedFriends } =
        await loadFriendsDashboard(user.id);

      if (!loadedProfile) {
        toast({
          title: "Profile not found",
          description: "We couldn't find your profile. Try signing out and back in.",
          variant: "destructive",
        });
        return;
      }

      setProfile(loadedProfile);
      setUsernameInput(loadedProfile.username ?? "");
      setFriendRequests(loadedRequests);
      setFriends(loadedFriends);
    } catch (error: unknown) {
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
      const data = await updateProfileUsername(profile.id, parsed.data);

      if (data) {
        setProfile(data);
        toast({
          title: "Username saved",
          description: "Friends can now find you by your username.",
        });
      }
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes("duplicate") || message.includes("already exists")) {
        toast({
          title: "Username taken",
          description: "That username is already in use. Try another one.",
          variant: "destructive",
        });
        return;
      }
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
      const targetProfile = await findProfileByUsername(targetUsername);

      if (!targetProfile) {
        toast({
          title: "User not found",
          description: "We couldn't find anyone with that username.",
          variant: "destructive",
        });
        return;
      }

      const existing = await findExistingFriendship(profile.id, targetProfile.id);

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

      await createFriendRequest(profile.id, targetProfile.id);

      setFriendUsername("");
      toast({
        title: "Friend request sent",
        description: "Your request has been sent to " + (targetProfile.username || "that user") + ".",
      });
    } catch (error: unknown) {
      const message = getErrorMessage(error);
      if (message.includes("unique") || message.includes("duplicate")) {
        toast({
          title: "Request already sent",
          description: "There's already a friend request between you.",
          variant: "destructive",
        });
        return;
      }
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
      await respondToFriendRequest(friendshipId, action);

      toast({
        title: action === "accept" ? "Friend added" : "Request declined",
      });

      loadProfileAndFriends();
    } catch (error: unknown) {
      console.error("Error updating friend request:", error);
      toast({
        title: "Couldn't update request",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFriend = async (friendshipId: string) => {
    try {
      setRemovingFriendshipId(friendshipId);

      await removeFriend(friendshipId);

      if (selectedFriend?.friendshipId === friendshipId) {
        setSelectedFriend(null);
      }

      toast({
        title: "Friend removed",
        description: "You won't see updates from this friend anymore.",
      });

      loadProfileAndFriends();
    } catch (error: unknown) {
      console.error("Error removing friend:", error);
      toast({
        title: "Couldn't remove friend",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setRemovingFriendshipId(null);
    }
  };

  const initialsForProfile = (p: ProfileRow | FriendWithFriendshipId) => {
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
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          onClick={() =>
                            handleRespondToRequest(request.friendshipId, "decline")
                          }
                        >
                          <X className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="calm"
                          className="h-8 w-8"
                          onClick={() =>
                            handleRespondToRequest(request.friendshipId, "accept")
                          }
                        >
                          <Check className="h-4 w-4" />
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
                      className="flex items-center justify-between gap-3 rounded-xl bg-muted/60 p-3"
                    >
                      <div className="flex items-center gap-3">
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
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          size="icon"
                          variant="outline"
                          className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                          disabled={removingFriendshipId === friend.friendshipId}
                          onClick={() => handleRemoveFriend(friend.friendshipId)}
                          aria-label="Remove friend"
                        >
                          {removingFriendshipId === friend.friendshipId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <X className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setSelectedFriend({
                              friendshipId: friend.friendshipId,
                              friendName: friend.display_name || friend.username || "Friend"
                            })
                          }
                        >
                          <MessageCircle className="h-4 w-4" />
                        </Button>
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

        {selectedFriend && profile && (
          <Card className="border-0 shadow-card">
            <CardContent className="p-0 h-[500px]">
              <MessageThread
                friendshipId={selectedFriend.friendshipId}
                friendName={selectedFriend.friendName}
                myProfileId={profile.id}
                onClose={() => setSelectedFriend(null)}
              />
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
};

export default Friends;
