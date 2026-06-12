import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { AccountDeleteButton } from "./account-delete-button";

describe("AccountDeleteButton", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  it("announces network failures without leaving the button disabled", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    render(<AccountDeleteButton />);

    fireEvent.click(screen.getByRole("button", { name: "회원 탈퇴" }));

    const alert = await screen.findByRole("alert");
    expect(alert).toHaveTextContent(
      "계정 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.",
    );
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(screen.getByRole("button", { name: "회원 탈퇴" })).toBeEnabled();
  });

  it("disables duplicate submissions while deletion is pending", async () => {
    let resolveRequest: ((response: Response) => void) | undefined;
    const fetchMock = vi.fn(
      () =>
        new Promise<Response>((resolve) => {
          resolveRequest = resolve;
        }),
    );
    vi.stubGlobal("fetch", fetchMock);
    render(<AccountDeleteButton />);

    const button = screen.getByRole("button", { name: "회원 탈퇴" });
    fireEvent.click(button);
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveRequest?.(
      new Response(JSON.stringify({ error: "failed" }), {
        status: 500,
        headers: { "content-type": "application/json" },
      }),
    );
    await waitFor(() => expect(button).toBeEnabled());
  });
});
