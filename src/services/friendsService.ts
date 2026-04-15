import { supabase } from "@/integrations/supabase/client";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function assertUuid(id: string, fieldName: string) {
  if (!UUID_REGEX.test(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
}

export interface ProfileRow {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
}

export type FriendRequestStatus = "pending" | "accepted" | "declined" | "blocked";

export interface FriendshipRow {
  id: string;
  requester_profile_id: string;
  addressee_profile_id: string;
  status: FriendRequestStatus;
  created_at: string;
  accepted_at: string | null;
}

export interface FriendRequest {
  friendshipId: string;
  fromProfile: ProfileRow;
  createdAt: string;
}

export interface FriendWithFriendshipId extends ProfileRow {
  friendshipId: string;
}

export async function loadFriendsDashboard(userId: string): Promise<{
  profile: ProfileRow | null;
  friendRequests: FriendRequest[];
  friends: FriendWithFriendshipId[];
}> {
  const { data: profileRow, error: profileError } = await supabase
    .from("profiles")
    .select("id, user_id, username, display_name")
    .eq("user_id", userId)
    .maybeSingle();

  if (profileError) throw profileError;
  if (!profileRow) {
    return { profile: null, friendRequests: [], friends: [] };
  }

  const typedProfile = profileRow as ProfileRow;

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

  const friendRequests: FriendRequest[] = (pendingFriendships ?? [])
    .map((f) => ({
      friendshipId: f.id as string,
      fromProfile: requestProfilesMap[f.requester_profile_id as string],
      createdAt: f.created_at as string,
    }))
    .filter((r) => r.fromProfile);

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

  const profileIdToFriendshipId: Record<string, string> = {};
  [...(asRequester ?? []), ...(asAddressee ?? [])].forEach((f) => {
    const friendProfileId =
      f.requester_profile_id === typedProfile.id ? f.addressee_profile_id : f.requester_profile_id;
    profileIdToFriendshipId[friendProfileId as string] = f.id as string;
  });

  let friends: FriendWithFriendshipId[] = [];
  if (uniqueFriendProfileIds.length > 0) {
    const { data: friendProfilesData, error: friendsError } = await supabase
      .from("profiles")
      .select("id, user_id, username, display_name")
      .in("id", uniqueFriendProfileIds);

    if (friendsError) throw friendsError;
    friends = (friendProfilesData ?? []).map((p) => ({
      ...(p as ProfileRow),
      friendshipId: profileIdToFriendshipId[p.id],
    }));
  }

  return { profile: typedProfile, friendRequests, friends };
}

export async function updateProfileUsername(profileId: string, username: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .update({ username })
    .eq("id", profileId)
    .select("id, user_id, username, display_name")
    .maybeSingle();

  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function findProfileByUsername(username: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, user_id, username, display_name")
    .ilike("username", username)
    .maybeSingle();
  if (error) throw error;
  return (data as ProfileRow | null) ?? null;
}

export async function findExistingFriendship(profileId: string, targetProfileId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .select("id, status, requester_profile_id, addressee_profile_id")
    .or(
      `and(requester_profile_id.eq.${profileId},addressee_profile_id.eq.${targetProfileId}),` +
        `and(requester_profile_id.eq.${targetProfileId},addressee_profile_id.eq.${profileId})`
    )
    .maybeSingle();

  if (error && error.code !== "PGRST116") {
    throw error;
  }
  return data;
}

export async function createFriendRequest(requesterProfileId: string, addresseeProfileId: string) {
  assertUuid(requesterProfileId, "requester profile id");
  assertUuid(addresseeProfileId, "addressee profile id");

  if (requesterProfileId === addresseeProfileId) {
    throw new Error("You cannot add yourself as a friend");
  }

  const { data: targetProfile, error: targetError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", addresseeProfileId)
    .maybeSingle();

  if (targetError) throw targetError;
  if (!targetProfile) {
    throw new Error("Target user does not exist");
  }

  const existing = await findExistingFriendship(requesterProfileId, addresseeProfileId);
  if (existing) {
    const status = (existing as { status?: string }).status;
    if (status === "pending") {
      throw new Error("Friend request already pending");
    }
    if (status === "accepted") {
      throw new Error("Users are already friends");
    }
    throw new Error("A previous friendship request already exists");
  }

  const { error } = await supabase.from("friendships").insert({
    requester_profile_id: requesterProfileId,
    addressee_profile_id: addresseeProfileId,
    status: "pending",
  });

  if (error) throw error;
}

export async function respondToFriendRequest(friendshipId: string, action: "accept" | "decline") {
  const update: Partial<FriendshipRow> =
    action === "accept"
      ? { status: "accepted", accepted_at: new Date().toISOString() }
      : { status: "declined" };

  const { error } = await supabase.from("friendships").update(update).eq("id", friendshipId);
  if (error) throw error;
}

export async function removeFriend(friendshipId: string) {
  assertUuid(friendshipId, "friendship id");

  const { data, error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId)
    .select("id")
    .maybeSingle();

  if (error) throw error;
  if (!data) {
    throw new Error("Friend relationship does not exist");
  }
}
