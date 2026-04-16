import { vi } from "vitest";
import type { Session, User } from "@supabase/supabase-js";

type AuthEvent = "SIGNED_IN" | "SIGNED_OUT";

let currentSession: Session | null = null;
const authStateListeners = new Set<(event: AuthEvent, session: Session | null) => void>();

function emitAuthState(event: AuthEvent, session: Session | null) {
  for (const cb of authStateListeners) {
    // `useAuth` registers an async callback; ignore return value.
    void cb(event, session);
  }
}

function createMockUser(userId: string, email: string, displayName?: string): User {
  // We cast to avoid having to keep this mock in sync with Supabase's full `User` shape.
  return {
    id: userId,
    email,
    user_metadata: { display_name: displayName ?? null },
    app_metadata: {},
    created_at: "",
    updated_at: "",
    role: "authenticated",
    factors: [],
    identities: [],
    last_sign_in_at: "",
    org_id: null,
  } as unknown as User;
}

export function createMockSession(opts?: {
  userId?: string;
  email?: string;
  displayName?: string;
}): Session {
  const user = createMockUser(opts?.userId ?? "user-1", opts?.email ?? "user@example.com", opts?.displayName);
  return {
    user,
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    token_type: "bearer",
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    provider_token: null,
  } as unknown as Session;
}

export function resetSupabaseAuthMock() {
  currentSession = null;
  authStateListeners.clear();

  // Reset mock call history.
  supabase.auth.getSession.mockClear();
  supabase.auth.onAuthStateChange.mockClear();
  supabase.auth.signUp.mockClear();
  supabase.auth.signInWithPassword.mockClear();
  supabase.auth.signOut.mockClear();
}

export function setCurrentSession(session: Session | null) {
  currentSession = session;
}

export const supabase = {
  auth: {
    getSession: vi.fn(async () => {
      return { data: { session: currentSession } };
    }),

    onAuthStateChange: vi.fn((callback: (event: AuthEvent, session: Session | null) => void) => {
      authStateListeners.add(callback);

      return {
        data: {
          subscription: {
            unsubscribe: () => {
              authStateListeners.delete(callback);
            },
          },
        },
      };
    }),

    signUp: vi.fn(async (params: { email: string }) => {
      // Default “valid” signup behavior for tests.
      if (params.email === "valid@example.com") {
        const session = createMockSession({ userId: "user-signup", email: params.email, displayName: "Alice" });
        currentSession = session;
        emitAuthState("SIGNED_IN", session);
        return { data: { session }, error: null };
      }

      return { data: { session: null }, error: new Error("User already registered") };
    }),

    signInWithPassword: vi.fn(async (params: { email: string; password: string }) => {
      if (params.email === "valid@example.com" && params.password === "correct-password") {
        const session = createMockSession({ userId: "user-signin", email: params.email, displayName: "Alice" });
        currentSession = session;
        emitAuthState("SIGNED_IN", session);
        return { data: { session }, error: null };
      }

      return {
        data: { session: null },
        error: new Error("Invalid login credentials"),
      };
    }),

    signOut: vi.fn(async () => {
      currentSession = null;
      emitAuthState("SIGNED_OUT", null);
      return { error: null };
    }),
  },

  // Present for service-layer code that may be mocked later.
  functions: {
    invoke: vi.fn(),
  },

  // Present for DB-layer services that may be mocked later.
  from: vi.fn(),
} as unknown as {
  auth: {
    getSession: ReturnType<typeof vi.fn>;
    onAuthStateChange: ReturnType<typeof vi.fn>;
    signUp: ReturnType<typeof vi.fn>;
    signInWithPassword: ReturnType<typeof vi.fn>;
    signOut: ReturnType<typeof vi.fn>;
  };
};

