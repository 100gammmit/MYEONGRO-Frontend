import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

const signInWithOAuth = vi.fn().mockResolvedValue({ error: null });

vi.mock("@/infrastructure/supabase/browser-client", () => ({
  createBrowserSupabaseClient: () => ({
    auth: { signInWithOAuth },
  }),
}));

import { AuthButtons } from "./auth-buttons";

describe("AuthButtons", () => {
  beforeEach(() => {
    signInWithOAuth.mockClear();
  });

  it("starts Kakao OAuth and preserves an encoded local next path", async () => {
    render(<AuthButtons next="/records/reading-1?tab=detail" />);
    fireEvent.click(screen.getByRole("button", { name: "카카오로 계속하기" }));

    await waitFor(() =>
      expect(signInWithOAuth).toHaveBeenCalledWith({
        provider: "kakao",
        options: {
          redirectTo:
            "http://localhost:3000/auth/callback?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
        },
      }),
    );
  });

  it("does not expose Google login", () => {
    render(<AuthButtons next="/records" />);

    expect(screen.queryByRole("button", { name: /google/i })).not.toBeInTheDocument();
  });
});
