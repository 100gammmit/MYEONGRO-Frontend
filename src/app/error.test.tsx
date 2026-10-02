import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ErrorPage from "./error";

describe("ErrorPage", () => {
  it("offers a retry and a way home without exposing the error", () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error("internal detail: db timeout")} reset={reset} />);

    expect(screen.getByRole("heading", { level: 1, name: "잠시 문제가 생겼어요" }))
      .toBeInTheDocument();
    expect(screen.queryByText(/internal detail/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈으로 가기" })).toHaveAttribute("href", "/");

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    expect(reset).toHaveBeenCalledTimes(1);
  });
});
