import { supabase } from "@/integrations/supabase/client";

export interface ProfileData {
  id: string;
  display_name: string | null;
  is_anonymous: boolean;
  created_at: string;
  discreet_mode: boolean;
}

export async function getProfileByUserId(userId: string): Promise<ProfileData | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, display_name, is_anonymous, created_at, discreet_mode")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;
  return (data as ProfileData | null) ?? null;
}

export async function updateAnonymousMode(profileId: string, isAnonymous: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ is_anonymous: isAnonymous })
    .eq("id", profileId);

  if (error) throw error;
}

export async function updateDiscreetMode(profileId: string, discreetMode: boolean) {
  const { error } = await supabase
    .from("profiles")
    .update({ discreet_mode: discreetMode })
    .eq("id", profileId);

  if (error) throw error;
}

export async function deleteAccount() {
  const { error } = await supabase.functions.invoke("delete-account");
  if (error) throw error;
}
