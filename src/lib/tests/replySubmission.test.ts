import { describe, expect, it, vi } from "vitest";
import {
  submitReplyWithModeration,
  extractFlaggedCategories,
  buildReplyBlockedToast,
} from "@/lib/forum/replySubmission";

describe("replySubmission", () => {
  it("extracts unique flagged categories", () => {
    const cats = extractFlaggedCategories({
      flagged: [{ category: "sensitive" }, { category: "sensitive" }, { category: "crisis" }],
    });
    expect(cats.sort()).toEqual(["crisis", "sensitive"].sort());
  });

  it("builds blocked toast payload", () => {
    expect(buildReplyBlockedToast(["sensitive"]).title).toBe("Reply blocked by moderation");
    expect(buildReplyBlockedToast(["sensitive"]).description).toContain("sensitive");
  });

  it("blocks reply when moderation.clean is false", async () => {
    const toastFn = vi.fn();

    const res = await submitReplyWithModeration({
      content: "retard",
      moderateContentFn: async () => ({
        clean: false,
        flagged: [{ category: "sensitive", term: "retard" }],
        outcome: "blocked_with_resources",
      }),
      toastFn,
      onAllowed: async () => {
        throw new Error("should not run");
      },
    });

    expect(res.blocked).toBe(true);
    expect(toastFn).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Reply blocked by moderation",
        description: expect.stringContaining("sensitive"),
        variant: "destructive",
      }),
    );
  });

  it("allows reply and calls onAllowed when moderation.clean is true", async () => {
    const toastFn = vi.fn();
    const onAllowed = vi.fn(async () => ({ inserted: true }));

    const res = await submitReplyWithModeration({
      content: "calm content",
      moderateContentFn: async () => ({
        clean: true,
        flagged: [],
        outcome: "allowed",
      }),
      toastFn,
      onAllowed,
    });

    expect(res.blocked).toBe(false);
    expect(onAllowed).toHaveBeenCalled();
    expect(toastFn).not.toHaveBeenCalled();
    expect(res.result).toEqual({ inserted: true });
  });
});

