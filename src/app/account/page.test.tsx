import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionState: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@/infrastructure/backend/request-cookies", () => ({
  getBackendCookieHeader: mocks.getCookieHeader,
}));
vi.mock("@/infrastructure/backend/session-auth", () => ({
  getSpringSessionState: mocks.getSessionState,
}));
vi.mock("@/infrastructure/backend/reading-records-client", () => ({
  BackendReadingRecordsClient: class {
    list = mocks.list;
  },
}));
vi.mock("./account-credit-summary", () => ({
  AccountCreditSummary: () => <p>87크레딧 남았어요</p>,
}));
vi.mock("./account-delete-button", () => ({
  AccountDeleteButton: ({ dailyCardStorageScope }: { dailyCardStorageScope: string }) => (
    <button data-scope={dailyCardStorageScope} type="button">계정 삭제</button>
  ),
}));
vi.mock("./consent-settings", () => ({
  ConsentSettings: () => <section>AI 리딩 정보 국외이전 관리</section>,
}));

import AccountPage from "./page";

async function renderAccountPage() {
  const Page = AccountPage as () => Promise<ReactElement>;
  return render(await Page());
}

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("JSESSIONID=session");
    mocks.list.mockResolvedValue([
      { id: "a", kind: "saju", status: "completed", input: {} },
      { id: "b", kind: "tarot", spreadType: "mind_three_card", status: "completed", input: {} },
      { id: "c", kind: "tarot", spreadType: "daily_one_card", status: "failed", input: {} },
    ]);
  });

  it("shows the account deletion control for authenticated users", async () => {
    mocks.getSessionState.mockResolvedValue({
      status: "authenticated",
      user: { id: "user-1" },
    });

    await renderAccountPage();

    expect(mocks.getSessionState).toHaveBeenCalledWith("JSESSIONID=session");
    expect(screen.getByRole("heading", { level: 1, name: "계정" })).toBeInTheDocument();
    expect(screen.getByText("87크레딧 남았어요")).toBeInTheDocument();
    expect(screen.getByText("저장된 리딩 2개")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "내 기록 보기" })).toHaveAttribute("href", "/records");
    expect(screen.getByText("AI 리딩 정보 국외이전 관리")).toBeInTheDocument();
    const deleteButton = screen.getByRole("button", { name: "계정 삭제" });
    expect(deleteButton).toHaveAttribute("data-scope", expect.stringMatching(/^user:[0-9a-f]{64}$/));
    expect(deleteButton.getAttribute("data-scope")).not.toContain("user-1");
  });

  it("keeps the records link without a count when the records list fails", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "authenticated", user: { id: "user-1" } });
    mocks.list.mockRejectedValue(new Error("backend down"));

    await renderAccountPage();

    expect(screen.queryByText(/저장된 리딩/)).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "내 기록 보기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정 삭제" })).toBeInTheDocument();
  });

  it("asks guests to log in before account management", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unauthenticated", user: null });

    await renderAccountPage();

    expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
      "href",
      "/login?next=%2Faccount",
    );
    expect(screen.queryByRole("button", { name: "계정 삭제" })).not.toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("creates only a generic retry body when session verification is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable", user: null });

    const Page = AccountPage as () => Promise<ReactElement | null>;
    render(await Page());

    expect(screen.getByRole("alert")).toHaveTextContent("페이지를 불러오지 못했어요");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "로그인하기" })).not.toBeInTheDocument();
  });
});
