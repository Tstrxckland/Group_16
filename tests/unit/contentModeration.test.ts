import { describe, expect, it } from "vitest";
import { censorContent, detectSensitiveContent } from "@/lib/contentModeration";

describe("contentModeration", () => {
  it("passes clean content without flags", () => {
    const result = detectSensitiveContent("Had a calm walk and felt better today.");
    expect(result.hasSensitive).toBe(false);
    expect(result.hasCrisisContent).toBe(false);
  });

  it("detects profanity and sensitive words", () => {
    const profanity = detectSensitiveContent("This is shit.");
    expect(profanity.hasSensitive).toBe(true);
    expect(profanity.hasCrisisContent).toBe(false);

    const sensitive = detectSensitiveContent("He called me a retard.");
    expect(sensitive.hasSensitive).toBe(true);
    expect(sensitive.hasCrisisContent).toBe(false);
  });

  it("detects crisis phrases specifically", () => {
    const result = detectSensitiveContent("I want to die and end my life.");
    expect(result.hasSensitive).toBe(true);
    expect(result.hasCrisisContent).toBe(true);
  });

  it("handles empty and null-like input safely", () => {
    const emptyResult = detectSensitiveContent("");
    expect(emptyResult).toEqual({ hasSensitive: false, hasCrisisContent: false });

    const nullResult = detectSensitiveContent(null);
    expect(nullResult).toEqual({ hasSensitive: false, hasCrisisContent: false });

    expect(censorContent(null)).toBe("");
    expect(censorContent("")).toBe("");
  });

  it("handles very long input and special characters", () => {
    const veryLong = `${"calm ".repeat(5000)}shit`;
    const result = detectSensitiveContent(veryLong);
    expect(result.hasSensitive).toBe(true);
    expect(result.hasCrisisContent).toBe(false);

    const specialChars = "s**t @#$%^&*() no direct profanity match";
    const specialResult = detectSensitiveContent(specialChars);
    expect(specialResult.hasSensitive).toBe(false);
  });

  it("censors detected terms in output text", () => {
    const censored = censorContent("This is shit and fuck.");
    expect(censored).not.toContain("shit");
    expect(censored).not.toContain("fuck");
    expect(censored).toContain("s***");
    expect(censored).toContain("f***");
  });
});
