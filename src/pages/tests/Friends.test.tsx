import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Friends from "@/pages/Friends";

const userMock = { id: "user-1", user_metadata: { display_name: "Me" } };

const {
  toastMock,
  loadFriendsDashboardMock,
  findProfileByUsernameMock,
  findExistingFriendshipMock,
  createFriendRequestMock,
  respondToFriendRequestMock,
  removeFriendMock,
  updateProfileUsernameMock,
} = vi.hoisted(() => ({
  toastMock: vi.fn(),
  loadFriendsDashboardMock: vi.fn(),
  findProfileByUsernameMock: vi.fn(),
  findExistingFriendshipMock: vi.fn(),
  createFriendRequestMock: vi.fn(),
  respondToFriendRequestMock: vi.fn(),
  removeFriendMock: vi.fn(),
  updateProfileUsernameMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: userMock, loading: false }),
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/services/friendsService", () => ({
  loadFriendsDashboard: loadFriendsDashboardMock,
  findProfileByUsername: findProfileByUsernameMock,
  findExistingFriendship: findExistingFriendshipMock,
  createFriendRequest: createFriendRequestMock,
  respondToFriendRequest: respondToFriendRequestMock,
  removeFriend: removeFriendMock,
  updateProfileUsername: updateProfileUsernameMock,
}));

// Avoid pulling in chat wiring / additional dependencies for these integration tests.
vi.mock("@/components/MessageThread", () => ({
  MessageThread: () => <div>chat</div>,
}));

describe("Friends page flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads peer discovery + friend management data", async () => {
    loadFriendsDashboardMock.mockResolvedValueOnce({
      profile: { id: "p1", user_id: "user-1", username: "my_username", display_name: "Me" },
      friendRequests: [
        {
          friendshipId: "req-1",
          createdAt: new Date().toISOString(),
          fromProfile: {
            id: "p2",
            user_id: "user-2",
            username: "bob_username",
            display_name: "Bob",
          },
        },
      ],
      friends: [
        { id: "f1", user_id: "user-3", username: "alice_username", display_name: "Alice", friendshipId: "fri-1" },
      ],
    });

    render(<Friends />);

    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(
      screen.getByText((t) => t.includes("@my_username")),
    ).toBeInTheDocument();
  });

  it("sends a friend request for a valid username", async () => {
    loadFriendsDashboardMock.mockResolvedValueOnce({
      profile: { id: "p1", user_id: "user-1", username: "my_username", display_name: "Me" },
      friendRequests: [],
      friends: [],
    });
    loadFriendsDashboardMock.mockResolvedValueOnce({
      profile: { id: "p1", user_id: "user-1", username: "my_username", display_name: "Me" },
      friendRequests: [],
      friends: [],
    });

    findProfileByUsernameMock.mockResolvedValueOnce({
      id: "p2",
      user_id: "user-2",
      username: "target_user",
      display_name: "Target",
    });
    findExistingFriendshipMock.mockResolvedValueOnce(null);
    createFriendRequestMock.mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    render(<Friends />);

    await screen.findByText("Add a friend");

    await user.type(screen.getByPlaceholderText(/friend's username/i), "target_user");
    await user.click(screen.getByRole("button", { name: /send request/i }));

    await waitFor(() => expect(findProfileByUsernameMock).toHaveBeenCalledWith("target_user"));
    await waitFor(() =>
      expect(createFriendRequestMock).toHaveBeenCalledWith("p1", "p2"),
    );

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Friend request sent" }),
      ),
    );

    await waitFor(() => expect(screen.getByPlaceholderText(/friend's username/i)).toHaveValue(""));
  });

  it("accepts a pending friend request", async () => {
    loadFriendsDashboardMock
      .mockResolvedValueOnce({
        profile: { id: "p1", user_id: "user-1", username: "my_username", display_name: "Me" },
        friendRequests: [
          {
            friendshipId: "req-1",
            createdAt: new Date().toISOString(),
            fromProfile: {
              id: "p2",
              user_id: "user-2",
              username: "bob_username",
              display_name: "Bob",
            },
          },
        ],
        friends: [],
      })
      .mockResolvedValueOnce({
        profile: { id: "p1", user_id: "user-1", username: "my_username", display_name: "Me" },
        friendRequests: [],
        friends: [
          {
            id: "f1",
            user_id: "user-2",
            username: "bob_username",
            display_name: "Bob",
            friendshipId: "fri-1",
          },
        ],
      });

    respondToFriendRequestMock.mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    render(<Friends />);

    const bob = await screen.findByText("Bob");
    const item = bob.closest("li");
    expect(item).toBeTruthy();

    const buttons = within(item as HTMLElement).getAllByRole("button");
    // First is decline (X), second is accept (Check).
    await user.click(buttons[1]);

    await waitFor(() =>
      expect(respondToFriendRequestMock).toHaveBeenCalledWith("req-1", "accept"),
    );

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Friend added" })),
    );
  });

  it("removes an accepted friend", async () => {
    loadFriendsDashboardMock
      .mockResolvedValueOnce({
        profile: { id: "p1", user_id: "user-1", username: "my_username", display_name: "Me" },
        friendRequests: [],
        friends: [
          {
            id: "f1",
            user_id: "user-2",
            username: "alice_username",
            display_name: "Alice",
            friendshipId: "fri-1",
          },
        ],
      })
      .mockResolvedValueOnce({
        profile: { id: "p1", user_id: "user-1", username: "my_username", display_name: "Me" },
        friendRequests: [],
        friends: [],
      });

    removeFriendMock.mockResolvedValueOnce(undefined);

    const user = userEvent.setup();
    render(<Friends />);

    await screen.findByText("Alice");
    await user.click(screen.getByLabelText("Remove friend"));

    await waitFor(() => expect(removeFriendMock).toHaveBeenCalledWith("fri-1"));
    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(expect.objectContaining({ title: "Friend removed" })),
    );
    expect(screen.getByText(/start by sending a request/i)).toBeInTheDocument();
  });
});

