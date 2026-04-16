import { describe, expect, it } from "vitest";
import { censorContent, detectSensitiveContent } from "@/lib/contentModeration";

describe("contentModeration", () => {
  it("passes clean content without flags", () => {
    const result = detectSensitiveContent("Had a calm walk and felt better today.");
    expect(result.hasSensitive).toBe(false);
    expect(result.hasCrisisContent).toBe(false);
  });

  it("does not modify benign content", () => {
    const benign = "Had a calm walk and felt better today.";
    expect(censorContent(benign)).toBe(benign);
    const result = detectSensitiveContent(benign);
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

  it("censors crisis phrasing too", () => {
    const censored = censorContent("I want to die and end my life.");
    expect(censored.toLowerCase()).not.toContain("die");
    expect(censored.toLowerCase()).not.toContain("end my life");
    // Still returns a string (no crash).
    expect(typeof censored).toBe("string");
  });

  it("does not block on pathological input (timeout budget)", () => {
    const evil = `${"a".repeat(50_000)} kill me ${"b".repeat(50_000)}`;

    const start1 = performance.now();
    const res = detectSensitiveContent(evil);
    const elapsed1 = performance.now() - start1;

    const start2 = performance.now();
    const censored = censorContent(evil);
    const elapsed2 = performance.now() - start2;

    // We only guarantee that the function returns quickly, not that it fully detects/censors
    // under an attack-level payload.
    expect(elapsed1).toBeLessThan(1000);
    expect(elapsed2).toBeLessThan(1000);

    expect(typeof res.hasSensitive).toBe("boolean");
    expect(typeof res.hasCrisisContent).toBe("boolean");
    expect(typeof censored).toBe("string");
  });
});

