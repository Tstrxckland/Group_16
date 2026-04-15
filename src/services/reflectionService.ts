import { supabase } from "@/integrations/supabase/client";

export interface Reflection {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

const MAX_REFLECTION_LENGTH = 10_000;

export function validateReflectionContent(content: string) {
  const trimmed = content.trim();
  if (!trimmed) return { ok: false as const, message: "Reflection cannot be empty." };
  if (trimmed.length > MAX_REFLECTION_LENGTH) {
    return {
      ok: false as const,
      message: `Reflection is too long (max ${MAX_REFLECTION_LENGTH} characters).`,
    };
  }
  return { ok: true as const, value: trimmed };
}

export async function listReflections(userId: string): Promise<Reflection[]> {
  const { data, error } = await supabase
    .from("reflections")
    .select("id, user_id, content, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as Reflection[]) ?? [];
}

export async function createReflection(input: { userId: string; content: string }): Promise<Reflection> {
  const validation = validateReflectionContent(input.content);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const { data, error } = await supabase
    .from("reflections")
    .insert({ user_id: input.userId, content: validation.value })
    .select("id, user_id, content, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as Reflection;
}

export async function updateReflection(input: {
  userId: string;
  id: string;
  content: string;
}): Promise<Reflection> {
  const validation = validateReflectionContent(input.content);
  if (!validation.ok) {
    throw new Error(validation.message);
  }

  const { data, error } = await supabase
    .from("reflections")
    .update({ content: validation.value })
    .eq("id", input.id)
    .eq("user_id", input.userId)
    .select("id, user_id, content, created_at, updated_at")
    .single();

  if (error) throw error;
  return data as Reflection;
}

export async function deleteReflection(input: { userId: string; id: string }): Promise<void> {
  const { error } = await supabase.from("reflections").delete().eq("id", input.id).eq("user_id", input.userId);
  if (error) throw error;
}

