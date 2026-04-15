import { beforeEach, describe, expect, it, vi } from "vitest";

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: fromMock,
  },
}));

import { createFriendRequest, removeFriend } from "@/services/friendsService";

const REQUESTER_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_ID = "22222222-2222-4222-8222-222222222222";
const FRIENDSHIP_ID = "33333333-3333-4333-8333-333333333333";

function createProfilesChain(maybeSingleResult: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    maybeSingle: vi.fn().mockResolvedValue(maybeSingleResult),
  };
  return chain;
}

function createFriendshipsChain(config: {
  existingResult?: { data: unknown; error: unknown };
  insertError?: unknown;
  deleteResult?: { data: unknown; error: unknown };
}) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    maybeSingle: vi
      .fn()
      .mockResolvedValue(config.existingResult ?? { data: null, error: null }),
    insert: vi.fn().mockResolvedValue({ error: config.insertError ?? null }),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
  };

  // removeFriend path uses delete().eq().select().maybeSingle()
  if (config.deleteResult) {
    chain.select = vi.fn().mockReturnThis();
    chain.maybeSingle = vi.fn().mockResolvedValue(config.deleteResult);
  }

  return chain;
}

describe("friendsService", () => {
  beforeEach(() => {
    fromMock.mockReset();
  });

  describe("createFriendRequest", () => {
    it("creates a friend request for valid users", async () => {
      const profilesChain = createProfilesChain({ data: { id: TARGET_ID }, error: null });
      const friendshipsChain = createFriendshipsChain({
        existingResult: { data: null, error: null },
      });

      fromMock.mockImplementation((table: string) => {
        if (table === "profiles") return profilesChain;
        if (table === "friendships") return friendshipsChain;
        throw new Error(`Unexpected table: ${table}`);
      });

      await expect(createFriendRequest(REQUESTER_ID, TARGET_ID)).resolves.toBeUndefined();
      expect(friendshipsChain.insert).toHaveBeenCalledWith({
        requester_profile_id: REQUESTER_ID,
        addressee_profile_id: TARGET_ID,
        status: "pending",
      });
    });

    it("rejects self-add attempts", async () => {
      await expect(createFriendRequest(REQUESTER_ID, REQUESTER_ID)).rejects.toThrow(
        "You cannot add yourself as a friend"
      );
      expect(fromMock).not.toHaveBeenCalled();
    });

    it("rejects invalid ids before database write", async () => {
      await expect(createFriendRequest("not-a-uuid", TARGET_ID)).rejects.toThrow(
        "Invalid requester profile id"
      );
      expect(fromMock).not.toHaveBeenCalled();
    });

    it("rejects missing target user", async () => {
      const profilesChain = createProfilesChain({ data: null, error: null });
      fromMock.mockImplementation((table: string) => {
        if (table === "profiles") return profilesChain;
        if (table === "friendships") return createFriendshipsChain({});
        throw new Error(`Unexpected table: ${table}`);
      });

      await expect(createFriendRequest(REQUESTER_ID, TARGET_ID)).rejects.toThrow(
        "Target user does not exist"
      );
    });

    it("rejects duplicate or existing relationships", async () => {
      const profilesChain = createProfilesChain({ data: { id: TARGET_ID }, error: null });
      const friendshipsChain = createFriendshipsChain({
        existingResult: { data: { id: FRIENDSHIP_ID, status: "accepted" }, error: null },
      });

      fromMock.mockImplementation((table: string) => {
        if (table === "profiles") return profilesChain;
        if (table === "friendships") return friendshipsChain;
        throw new Error(`Unexpected table: ${table}`);
      });

      await expect(createFriendRequest(REQUESTER_ID, TARGET_ID)).rejects.toThrow(
        "Users are already friends"
      );
      expect(friendshipsChain.insert).not.toHaveBeenCalled();
    });
  });

  describe("removeFriend", () => {
    it("deletes an existing friendship", async () => {
      const friendshipsChain = createFriendshipsChain({
        deleteResult: { data: { id: FRIENDSHIP_ID }, error: null },
      });

      fromMock.mockImplementation((table: string) => {
        if (table === "friendships") return friendshipsChain;
        throw new Error(`Unexpected table: ${table}`);
      });

      await expect(removeFriend(FRIENDSHIP_ID)).resolves.toBeUndefined();
      expect(friendshipsChain.delete).toHaveBeenCalled();
    });

    it("rejects invalid friendship id", async () => {
      await expect(removeFriend("bad-id")).rejects.toThrow("Invalid friendship id");
      expect(fromMock).not.toHaveBeenCalled();
    });

    it("returns clear error when friendship does not exist", async () => {
      const friendshipsChain = createFriendshipsChain({
        deleteResult: { data: null, error: null },
      });

      fromMock.mockImplementation((table: string) => {
        if (table === "friendships") return friendshipsChain;
        throw new Error(`Unexpected table: ${table}`);
      });

      await expect(removeFriend(FRIENDSHIP_ID)).rejects.toThrow(
        "Friend relationship does not exist"
      );
    });
  });
});
