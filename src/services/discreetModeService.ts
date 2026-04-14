import { supabase } from "@/integrations/supabase/client";

export async function getDiscreetModeByUserId(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("profiles")
    .select("discreet_mode")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return !!(data as { discreet_mode?: boolean } | null)?.discreet_mode;
}

export function subscribeToDiscreetModeChanges(
  userId: string,
  onUpdate: (discreetMode: boolean) => void
): () => void {
  const channel = supabase
    .channel("discreet-mode-changes")
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "profiles",
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newData = payload.new as { discreet_mode?: boolean };
        onUpdate(!!newData.discreet_mode);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
