import { supabase } from "@/integrations/supabase/client";

export type Mood = "good" | "okay" | "tough";

export interface JournalEntry {
  id: string;
  mood: Mood;
  content: string;
  reflection: string | null;
  created_at: string;
}

export async function listJournalEntries(userId: string): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from("journal_entries")
    .select("id, mood, content, reflection, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as JournalEntry[]) ?? [];
}

export async function createJournalEntry(input: {
  userId: string;
  mood: Mood;
  content: string;
  reflection?: string;
}): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from("journal_entries")
    .insert({
      user_id: input.userId,
      mood: input.mood,
      content: input.content,
      reflection: input.reflection || null,
    })
    .select("id, mood, content, reflection, created_at")
    .single();

  if (error) throw error;
  return data as JournalEntry;
}
