import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { censorContent } from "@/lib/contentModeration";

const {
  toastMock,
  authMock,
  createCommunityPostMock,
  listCommunityPostsMock,
  listCommentCountsByPostIdMock,
  listLikeCountsByPostIdMock,
  listLikedPostIdsForUserMock,
  moderateContentMock,
} = vi.hoisted(() => ({
  toastMock: vi.fn(),
  authMock: {
    user: {
      id: "user-1",
      user_metadata: { display_name: "Me" },
    },
    loading: false,
  },
  createCommunityPostMock: vi.fn(),
  listCommunityPostsMock: vi.fn(),
  listCommentCountsByPostIdMock: vi.fn(),
  listLikeCountsByPostIdMock: vi.fn(),
  listLikedPostIdsForUserMock: vi.fn(),
  moderateContentMock: vi.fn(),
}));

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authMock,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/services/moderationService", () => ({
  moderateContent: moderateContentMock,
}));

vi.mock("@/services/communityPostsService", () => ({
  countCommentsForPost: vi.fn(),
  countLikesForPost: vi.fn(),
  createCommunityPost: createCommunityPostMock,
  deleteCommunityPost: vi.fn(),
  getCommunityPostById: vi.fn(),
  getDisplayNameForUser: vi.fn(),
  listCommentCountsByPostId: listCommentCountsByPostIdMock,
  listCommunityPosts: listCommunityPostsMock,
  listLikedPostIdsForUser: listLikedPostIdsForUserMock,
  listLikeCountsByPostId: listLikeCountsByPostIdMock,
  likePost: vi.fn(),
  unlikePost: vi.fn(),
  updateCommunityPostContent: vi.fn(),
}));

function PostSubmitHarness() {
  const {
    newPostTitle,
    setNewPostTitle,
    newPost,
    setNewPost,
    submitPost,
    postAnonymously,
  } = useCommunityPosts();

  return (
    <div>
      <div data-testid="post-anon">{String(postAnonymously)}</div>
      <input
        aria-label="Add a title"
        value={newPostTitle}
        onChange={(e) => setNewPostTitle(e.target.value)}
      />
      <textarea
        aria-label="Write a post"
        value={newPost}
        onChange={(e) => setNewPost(e.target.value)}
      />
      <button type="button" onClick={() => submitPost()}>
        Submit
      </button>
    </div>
  );
}

describe("useCommunityPosts submitPost", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Prevent initial fetchPosts from doing anything substantial.
    listCommunityPostsMock.mockResolvedValue([]);
    listCommentCountsByPostIdMock.mockResolvedValue({});
    listLikeCountsByPostIdMock.mockResolvedValue({});
    listLikedPostIdsForUserMock.mockResolvedValue([]);

    createCommunityPostMock.mockResolvedValue({
      id: "post-1",
      created_at: new Date().toISOString(),
    });

    moderateContentMock.mockResolvedValue({
      clean: true,
      flagged: [],
      outcome: "allowed",
    });
  });

  it("censors sensitive words before creating a forum post", async () => {
    const user = userEvent.setup();
    render(<PostSubmitHarness />);

    await user.type(screen.getByLabelText("Add a title"), "My title");
    await user.type(screen.getByLabelText("Write a post"), "I feel like shit today");

    // Default is anonymized; keeps authorName null.
    expect(screen.getByTestId("post-anon")).toHaveTextContent("true");

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(createCommunityPostMock).toHaveBeenCalled());

    const payload = createCommunityPostMock.mock.calls[0][0];
    const composed = "My title\n\nI feel like shit today";
    const expectedCensored = censorContent(composed);

    expect(payload.isAnonymous).toBe(true);
    expect(payload.content).toBe(expectedCensored);
    expect(payload.content).not.toContain("shit");
  });

  it("blocks posting when moderation.clean is false", async () => {
    moderateContentMock.mockResolvedValueOnce({
      clean: false,
      flagged: [{ category: "profanity", term: "shit" }],
      outcome: "flagged",
    });

    const user = userEvent.setup();
    render(<PostSubmitHarness />);

    await user.type(screen.getByLabelText("Add a title"), "My title");
    await user.type(screen.getByLabelText("Write a post"), "This contains shit");

    await user.click(screen.getByRole("button", { name: "Submit" }));

    await waitFor(() => expect(moderateContentMock).toHaveBeenCalled());
    expect(createCommunityPostMock).not.toHaveBeenCalled();

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Post blocked by moderation" }),
      ),
    );
  });
});

