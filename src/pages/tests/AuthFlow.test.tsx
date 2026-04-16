import { describe, expect, it, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Auth from "@/pages/Auth";
import { resetSupabaseAuthMock } from "@/test/mocks/supabase";

const toastMock = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: toastMock }),
}));

vi.mock("@/integrations/supabase/client", async () => {
  const mod = await import("@/test/mocks/supabase");
  return { supabase: mod.supabase };
});

describe("Auth page flow", () => {
  beforeEach(() => {
    resetSupabaseAuthMock();
    toastMock.mockReset();
  });

  it("registers a new user and navigates to /dashboard", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<div>dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /sign up/i }));

    await user.type(screen.getByLabelText(/email/i), "valid@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-password");
    await user.type(screen.getByLabelText(/display name/i), "Alice");

    await user.click(screen.getByRole("button", { name: /create account/i }));

    await waitFor(() => expect(screen.getByText("dashboard")).toBeInTheDocument());

    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Account created!" }),
    );
  });

  it("shows an error toast for invalid login and does not navigate", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<div>dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "valid@example.com");
    await user.type(screen.getByLabelText(/password/i), "wrong-password");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() =>
      expect(toastMock).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Login failed" }),
      ),
    );

    expect(screen.queryByText("dashboard")).not.toBeInTheDocument();
  });

  it("logs in with valid credentials and navigates to /dashboard", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<div>dashboard</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await user.type(screen.getByLabelText(/email/i), "valid@example.com");
    await user.type(screen.getByLabelText(/password/i), "correct-password");

    await user.click(screen.getByRole("button", { name: /sign in/i }));

    await waitFor(() => expect(screen.getByText("dashboard")).toBeInTheDocument());
    expect(toastMock).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Welcome back!" }),
    );
  });
});

