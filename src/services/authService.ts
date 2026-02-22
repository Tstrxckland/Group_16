/**
 * F1.4 Auth Service
 * Pure functions wrapping supabase.auth. No direct Supabase auth calls from UI or hooks.
 */
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface SignUpParams {
  email: string;
  password: string;
  username?: string;
  displayName?: string;
}

export interface AuthResult {
  error: Error | null;
}

export interface GetSessionResult {
  session: Session | null;
  error: Error | null;
}

export type AuthStateChangeCallback = (event: string, session: Session | null) => void;

/**
 * Returns the current session. Use for initial load; prefer onAuthStateChange for reactivity.
 */
export async function getSession(): Promise<GetSessionResult> {
  const { data, error } = await supabase.auth.getSession();
  return {
    session: data.session ?? null,
    error: error ?? null,
  };
}

/**
 * Subscribes to auth state changes. Returns an unsubscribe function.
 */
export function onAuthStateChange(callback: AuthStateChangeCallback): () => void {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
  return () => subscription.unsubscribe();
}

export async function signUpWithEmail({
  email,
  password,
  username,
  displayName,
}: SignUpParams): Promise<AuthResult> {
  const redirectUrl = `${window.location.origin}/`;
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: {
        display_name: displayName ?? undefined,
        username: username ?? undefined,
      },
    },
  });
  return { error: error ?? null };
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ?? null };
}

export async function signInWithGoogle(): Promise<AuthResult> {
  const redirectUrl = `${window.location.origin}/`;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: redirectUrl },
  });
  return { error: error ?? null };
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
}

export async function resetPassword(email: string): Promise<AuthResult> {
  const redirectUrl = `${window.location.origin}/auth?reset=true`;
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectUrl,
  });
  return { error: error ?? null };
}

export async function updatePassword(newPassword: string): Promise<AuthResult> {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error ?? null };
}
