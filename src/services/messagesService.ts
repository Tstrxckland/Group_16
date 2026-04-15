import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  content: string;
  sender_profile_id: string;
  created_at: string;
}

export async function listMessages(friendshipId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("friendship_id", friendshipId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as Message[]) ?? [];
}

export async function sendMessage(friendshipId: string, senderProfileId: string, content: string) {
  const { error } = await supabase.from("messages").insert({
    friendship_id: friendshipId,
    sender_profile_id: senderProfileId,
    content,
  });

  if (error) throw error;
}

export function subscribeToMessages(
  friendshipId: string,
  onInsert: (message: Message) => void
): () => void {
  const channel = supabase
    .channel(`messages:${friendshipId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `friendship_id=eq.${friendshipId}`,
      },
      (payload) => {
        onInsert(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
