import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ReadingCreditAccessNotice } from "./reading-credit-access-notice";

describe("ReadingCreditAccessNotice", () => {
  it("explains the cost and current balance in user-facing order", () => {
    render(<ReadingCreditAccessNotice
      access={{ status: "allowed", required: 3, remaining: 7 }}
      onRetry={vi.fn()}
    />);

    expect(screen.getByText("3크레딧 사용 · 현재 7크레딧")).toBeInTheDocument();
  });

  it("offers retry when credit access cannot be checked", () => {
    const onRetry = vi.fn();
    render(<ReadingCreditAccessNotice access={{ status: "unavailable" }} onRetry={onRetry} />);

    fireEvent.click(screen.getByRole("button", { name: "다시 확인" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
