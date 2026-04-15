import { supabase } from "@/integrations/supabase/client";

export async function getCompletedChallengesCount(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from("profiles")
    .select("completed_challenges")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  const completed = (data?.completed_challenges as string[] | null) ?? [];
  return completed.length;
}

export async function getJournalEntryDates(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("created_at")
    .eq("user_id", userId);

  if (error) throw error;
  return (data ?? []).map((entry) => entry.created_at as string);
}
