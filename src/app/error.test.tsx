import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const router = {
  refresh: vi.fn(),
};

vi.mock("next/navigation", () => ({
  useRouter: () => router,
}));

import ErrorPage from "./error";

describe("ErrorPage", () => {
  it("offers a way home without exposing the error", () => {
    render(<ErrorPage error={new Error("internal detail: db timeout")} reset={vi.fn()} />);

    expect(screen.getByRole("heading", { level: 1, name: "잠시 문제가 생겼어요" }))
      .toBeInTheDocument();
    expect(screen.queryByText(/internal detail/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로 가기" })).toHaveAttribute("href", "/");
  });

  it("refetches the server result before re-rendering on retry", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("failed")} reset={reset} />);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(router.refresh).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
