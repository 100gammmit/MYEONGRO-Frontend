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

  it("tells the user to try again tomorrow when credits run short", () => {
    render(<ReadingCreditAccessNotice
      access={{ status: "insufficient", required: 4, remaining: 2, nextResetAt: "2026-09-16T15:00:00Z" }}
      onRetry={vi.fn()}
    />);

    expect(screen.getByRole("alert")).toHaveTextContent(
      "이 리딩에는 4크레딧이 필요한데 지금 2크레딧이 남아 있어요. 크레딧은 내일 0시에 다시 채워지니, 내일 다시 시도해 주세요.",
    );
  });
});
