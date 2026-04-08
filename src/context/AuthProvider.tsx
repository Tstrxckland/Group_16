import {
  createContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import * as authService from "@/services/authService";

export interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: Error | null;
  clearError: () => void;
  signUp: (
    email: string,
    password: string,
    username?: string,
    displayName?: string
  ) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const applySession = useCallback((newSession: Session | null) => {
    setSession(newSession);
    setUser(newSession?.user ?? null);
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChange((_event, newSession) => {
      applySession(newSession);
    });

    authService.getSession().then(({ session: initialSession, error: sessionError }) => {
      if (sessionError) {
        setError(sessionError);
      }
      applySession(initialSession);
    });

    return unsubscribe;
  }, [applySession]);

  const clearError = useCallback(() => setError(null), []);

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      username?: string,
      displayName?: string
    ) => {
      setError(null);
      const result = await authService.signUpWithEmail({
        email,
        password,
        username,
        displayName,
      });
      if (result.error) setError(result.error);
      return result;
    },
    []
  );

  const signIn = useCallback(async (email: string, password: string) => {
    setError(null);
    const result = await authService.signInWithEmail(email, password);
    if (result.error) setError(result.error);
    return result;
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    const result = await authService.signInWithGoogle();
    if (result.error) setError(result.error);
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setError(null);
    await authService.signOut();
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setError(null);
    const result = await authService.resetPassword(email);
    if (result.error) setError(result.error);
    return result;
  }, []);

  const updatePassword = useCallback(async (newPassword: string) => {
    setError(null);
    const result = await authService.updatePassword(newPassword);
    if (result.error) setError(result.error);
    return result;
  }, []);

  const value: AuthContextValue = {
    user,
    session,
    loading,
    error,
    clearError,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    resetPassword,
    updatePassword,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export { AuthContext };
