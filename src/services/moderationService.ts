import { supabase } from "@/integrations/supabase/client";

export type ModerationCategory = "profanity" | "crisis" | "slurs";

export interface ModerationFlag {
  category: ModerationCategory;
  term: string;
}

export interface ModerationResult {
  clean: boolean;
  flagged: ModerationFlag[];
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
  };
}
