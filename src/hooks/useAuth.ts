import { useContext } from "react";
import { AuthContext } from "@/context/AuthProvider";

/**
 * Hook for auth state and actions. Must be used within AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { AuthProvider } from "@/context/AuthProvider";
