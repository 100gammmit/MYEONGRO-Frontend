import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  state: { status: "idle", data: null } as { status: string; data: unknown },
  refresh: vi.fn(),
}));

vi.mock("@/components/reading-credit-provider", () => ({
  useReadingCredits: () => ({ state: mocks.state, refresh: mocks.refresh }),
}));

import { AccountCreditSummary } from "./account-credit-summary";

describe("AccountCreditSummary", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("shows the balance with its free and extra parts", () => {
    mocks.state = { status: "ready", data: { balance: { total: 87, free: 7, paid: 80 } } };

    render(<AccountCreditSummary />);

    expect(screen.getByText("87")).toBeInTheDocument();
    expect(screen.getByText(/크레딧 남았어요/)).toBeInTheDocument();
    expect(screen.getByText(/오늘 무료 7 · 추가 80/)).toBeInTheDocument();
  });

  it("says it is checking while the balance loads", () => {
    mocks.state = { status: "loading", data: null };

    render(<AccountCreditSummary />);

    expect(screen.getByRole("status")).toHaveTextContent("크레딧을 확인하고 있어요.");
  });

  it("offers to check again when the balance fails", () => {
    mocks.state = { status: "error", data: null };

    render(<AccountCreditSummary />);
    fireEvent.click(screen.getByRole("button", { name: "다시 확인" }));

    expect(screen.queryByText(/크레딧 남았어요/)).not.toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalledTimes(1);
  });
});
