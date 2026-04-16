import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { resetSupabaseAuthMock } from "@/test/mocks/supabase";

vi.mock("@/integrations/supabase/client", async () => {
  const mod = await import("@/test/mocks/supabase");
  return { supabase: mod.supabase };
});

function AuthTestUI() {
  const { user, loading, signUp, signIn, signOut } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  // Exported UI for actions & assertions.
  return (
    <div>
      <div data-testid="auth-state">{loading ? "loading" : user ? "signed-in" : "signed-out"}</div>
      {errorMessage ? <div data-testid="auth-error">{errorMessage}</div> : null}

      <button
        type="button"
        onClick={async () => {
          const { error } = await signUp("valid@example.com", "correct-password", "Alice");
          setErrorMessage(error?.message ?? null);
        }}
      >
        sign up
      </button>

      <button
        type="button"
        onClick={async () => {
          const { error } = await signIn("valid@example.com", "correct-password");
          setErrorMessage(error?.message ?? null);
        }}
      >
        sign in
      </button>

      <button
        type="button"
        onClick={async () => {
          const { error } = await signIn("valid@example.com", "wrong-password");
          setErrorMessage(error?.message ?? null);
        }}
      >
        sign in invalid
      </button>

      <button
        type="button"
        onClick={async () => {
          await signOut();
          setErrorMessage(null);
        }}
      >
        sign out
      </button>
    </div>
  );
}

describe("useAuth (AuthProvider + AuthContext)", () => {
  beforeEach(() => {
    resetSupabaseAuthMock();
  });

  afterEach(() => {
    cleanup();
  });

  it("User can sign up with email/password", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthTestUI />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out"));

    await user.click(screen.getByText("sign up"));
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in"));
    expect(screen.queryByTestId("auth-error")).not.toBeInTheDocument();
  });

  it("User can sign in with valid credentials", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthTestUI />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out"));

    await user.click(screen.getByText("sign in"));
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in"));
  });

  it("User receives error for invalid credentials", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthTestUI />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out"));

    await user.click(screen.getByText("sign in invalid"));
    await waitFor(() => expect(screen.getByTestId("auth-error")).toHaveTextContent("Invalid login credentials"));

    // Auth state should remain signed out.
    expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out");
  });

  it("User can sign out", async () => {
    const user = userEvent.setup();

    render(
      <AuthProvider>
        <AuthTestUI />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out"));
    await user.click(screen.getByText("sign in"));
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in"));

    await user.click(screen.getByText("sign out"));
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out"));
  });

  it("Auth state persists across page refresh (remount)", async () => {
    const user = userEvent.setup();

    const { unmount } = render(
      <AuthProvider>
        <AuthTestUI />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-out"));
    await user.click(screen.getByText("sign in"));
    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in"));

    // Simulate refresh: remount provider while keeping the same mock session.
    unmount();
    render(
      <AuthProvider>
        <AuthTestUI />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId("auth-state")).toHaveTextContent("signed-in"));
  });
});

