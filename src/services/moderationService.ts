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

export async function moderateContent(content: string): Promise<ModerationResult> {
  const { data, error } = await supabase.functions.invoke("moderate-content", {
    body: { content },
  });

  if (error) throw error;

  const parsed = data as Partial<ModerationResult> | null;
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
