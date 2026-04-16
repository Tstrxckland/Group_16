import { supabase } from "@/integrations/supabase/client";

export type ModerationCategory = "profanity" | "sensitive" | "crisis";

export interface ModerationFlag {
  category: ModerationCategory;
  term: string;
}

export interface ModerationResult {
  clean: boolean;
  flagged: ModerationFlag[];
  outcome: "allowed" | "flagged" | "blocked_with_resources";
  supportiveMessage?: string;
  resources?: Array<{ label: string; url: string }>;
}

const IS_TEST_ENV =
  // In browser builds, `process` is undefined; this keeps the check safe.
  typeof process !== "undefined" && process.env?.NODE_ENV === "test";

const ALLOW_WHEN_UNAVAILABLE =
  !IS_TEST_ENV &&
  (import.meta.env.DEV ||
    String(import.meta.env.VITE_SKIP_EDGE_MODERATION || "").toLowerCase() === "true");

function allowResult(): ModerationResult {
  return { clean: true, flagged: [], outcome: "allowed" };
}

export async function moderateContent(content: string): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke("moderate-content", {
    body: { content },
  });

  if (error) {
    // In local/dev, don't block posting when the edge function is unreachable or missing.
    if (ALLOW_WHEN_UNAVAILABLE) {
      console.warn("moderate-content unavailable, allowing content in dev mode:", error);
      return allowResult();
    }
    throw error;
  }

  const parsed = data as Partial<ModerationResult> | null;
  if (!parsed && ALLOW_WHEN_UNAVAILABLE) {
    return allowResult();
  }

  return {
    clean: !!parsed?.clean,
    flagged: Array.isArray(parsed?.flagged) ? (parsed?.flagged as ModerationFlag[]) : [],
    outcome: (parsed?.outcome as ModerationResult["outcome"]) || "allowed",
    supportiveMessage:
      typeof parsed?.supportiveMessage === "string" ? parsed.supportiveMessage : undefined,
    resources: Array.isArray(parsed?.resources)
      ? (parsed.resources as Array<{ label: string; url: string }>)
      : undefined,
  };
}
