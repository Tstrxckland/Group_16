import { supabase } from "@/integrations/supabase/client";

export async function getCompletedChallengeIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("completed_challenges")
    .eq("user_id", userId)
    .single();

  if (error) throw error;
  return (data?.completed_challenges as string[] | null) ?? [];
}

export async function saveCompletedChallengeIds(userId: string, completedIds: string[]) {
  const { error } = await supabase
    .from("profiles")
    .update({ completed_challenges: completedIds })
    .eq("user_id", userId);

  if (error) throw error;
}
