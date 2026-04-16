import { describe, expect, it, vi } from "vitest";
import {
  deriveThreadTitle,
  deriveThreadPreview,
  deriveThreadBody,
  postMatchesTopic,
} from "@/pages/Community";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(),
      getSession: vi.fn(),
    },
    functions: {
      invoke: vi.fn(),
    },
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

describe("forum thread utils", () => {
  it("deriveThreadTitle returns default when first line is empty", () => {
    expect(deriveThreadTitle("\n\nBody only")).toBe("Shared reflection");
  });

  it("deriveThreadTitle returns short first line as-is", () => {
    expect(deriveThreadTitle("A calm thought\nBody")).toBe("A calm thought");
  });

  it("deriveThreadTitle truncates long first line", () => {
    const long = "L".repeat(80);
    const out = deriveThreadTitle(`${long}\nBody`);
    expect(out).toBe(`${long.slice(0, 69)}…`);
  });

  it("deriveThreadPreview returns empty when there is no body", () => {
    expect(deriveThreadPreview("Only title")).toBe("");
  });

  it("deriveThreadPreview joins remaining lines and normalizes whitespace", () => {
    const content = "Title\n\n  first line  \nsecond   line";
    expect(deriveThreadPreview(content)).toBe("first line second line");
  });

  it("deriveThreadPreview truncates long previews", () => {
    const body = "word ".repeat(60).trim(); // > 100 chars after normalization
    const content = `Title\n${body}`;
    const out = deriveThreadPreview(content);
    expect(out).toBe(`${body.slice(0, 97)}…`);
  });

  it("deriveThreadBody returns everything after first line", () => {
    const content = "Title\nline 1\n line 2 \n\n";
    expect(deriveThreadBody(content)).toBe("line 1\nline 2");
  });

  it("postMatchesTopic matches case-insensitively and handles 'all'", () => {
    const post = { tags: ["Wins", "support"] } as any;
    expect(postMatchesTopic(post, "all")).toBe(true);
    expect(postMatchesTopic(post, "wins")).toBe(true);
    expect(postMatchesTopic(post, "SUPPORT")).toBe(true);
    expect(postMatchesTopic(post, "college")).toBe(false);
  });
});

