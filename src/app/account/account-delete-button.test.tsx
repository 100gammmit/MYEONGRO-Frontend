import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const router = {
  push: vi.fn(),
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

import { AccountDeleteButton } from "./account-delete-button";

describe("AccountDeleteButton", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", vi.fn());
    vi.stubGlobal("confirm", vi.fn());
  });

  it("does not delete the account when confirmation is cancelled", () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    render(<AccountDeleteButton />);

    fireEvent.click(screen.getByRole("button", { name: "계정 삭제" }));

    expect(window.fetch).not.toHaveBeenCalled();
  });

  it("deletes the account and returns home after confirmation", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    vi.mocked(window.fetch).mockResolvedValue(new Response(null, { status: 204 }));

    render(<AccountDeleteButton />);

    fireEvent.click(screen.getByRole("button", { name: "계정 삭제" }));

    await waitFor(() => {
      expect(window.fetch).toHaveBeenCalledWith("/api/account", {
        method: "DELETE",
        cache: "no-store",
      });
    });
    expect(router.push).toHaveBeenCalledWith("/");
    expect(router.refresh).toHaveBeenCalledWith();
  });

  it("shows an error when account deletion fails", async () => {
    vi.mocked(window.confirm).mockReturnValue(true);
    vi.mocked(window.fetch).mockResolvedValue(
      Response.json({ code: "WITHDRAWAL_FAILED" }, { status: 502 }),
    );

    render(<AccountDeleteButton />);

    fireEvent.click(screen.getByRole("button", { name: "계정 삭제" }));

    expect(
      await screen.findByText("계정을 삭제하지 못했어요. 잠시 후 다시 시도해 주세요."),
    ).toBeInTheDocument();
    expect(router.push).not.toHaveBeenCalled();
  });
});
