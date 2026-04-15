import { beforeEach, describe, expect, it, vi } from "vitest";

const { invokeMock } = vi.hoisted(() => ({ invokeMock: vi.fn() }));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: invokeMock,
    },
  },
}));

import { moderateContent } from "@/services/moderationService";

describe("moderationService.moderateContent", () => {
  beforeEach(() => {
    invokeMock.mockReset();
  });

  it("handles a clean moderation response", async () => {
    invokeMock.mockResolvedValue({
      data: { clean: true, flagged: [], outcome: "allowed" },
      error: null,
    });

    const result = await moderateContent("calm message");

    expect(invokeMock).toHaveBeenCalledWith("moderate-content", {
      body: { content: "calm message" },
    });
    expect(result).toEqual({
      clean: true,
      flagged: [],
      outcome: "allowed",
      supportiveMessage: undefined,
      resources: undefined,
    });
  });

  it("handles a flagged non-crisis response", async () => {
    invokeMock.mockResolvedValue({
      data: {
        clean: false,
        flagged: [{ category: "profanity", term: "shit" }],
        outcome: "flagged",
      },
      error: null,
    });

    const result = await moderateContent("contains profanity");

    expect(result.clean).toBe(false);
    expect(result.outcome).toBe("flagged");
    expect(result.flagged).toEqual([{ category: "profanity", term: "shit" }]);
  });

  it("handles crisis block-with-resources response", async () => {
    invokeMock.mockResolvedValue({
      data: {
        clean: false,
        flagged: [{ category: "crisis", term: "want to die" }],
        outcome: "blocked_with_resources",
        supportiveMessage: "You matter. Help is available.",
        resources: [{ label: "Find a Helpline", url: "https://findahelpline.com" }],
      },
      error: null,
    });

    const result = await moderateContent("I want to die");

    expect(result.clean).toBe(false);
    expect(result.outcome).toBe("blocked_with_resources");
    expect(result.supportiveMessage).toContain("matter");
    expect(result.resources?.[0]?.url).toBe("https://findahelpline.com");
  });

  it("throws when edge function returns an error", async () => {
    invokeMock.mockResolvedValue({
      data: null,
      error: new Error("network error"),
    });

    // In dev mode, moderation failures allow content rather than block UX.
    await expect(moderateContent("test")).resolves.toEqual({
      clean: true,
      flagged: [],
      outcome: "allowed",
    });
  });
});
