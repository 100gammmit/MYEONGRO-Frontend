import type { ReactElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

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
    constructor(readonly cookieHeader: string) {
      expect(cookieHeader).toBe("JSESSIONID=session");
    }

    list = mocks.list;
  },
}));

import RecordsPage from "./page";

async function renderRecordsPage(kind?: string) {
  const Page = RecordsPage as (props: {
    searchParams: Promise<{ kind?: string }>;
  }) => Promise<ReactElement>;

  return render(await Page({ searchParams: Promise.resolve(kind ? { kind } : {}) }));
}

const RECORDS = [
  {
    id: "reading-1",
    kind: "tarot",
    spreadType: "relationship_three_card",
    schemaVersion: 2,
    status: "completed",
    title: "관계의 흐름",
    input: {},
    createdAt: "2026-11-12T00:00:00.000Z",
  },
  {
    id: "reading-2",
    kind: "saju",
    status: "failed",
    title: "Generating...",
    input: { targetYear: 2026 },
    errorCode: "GENERATION_TIMEOUT",
    createdAt: "2026-11-11T00:00:00.000Z",
  },
  {
    id: "reading-3",
    kind: "tarot",
    spreadType: "mind_three_card",
    schemaVersion: 2,
    status: "generating",
    title: "Generating...",
    input: {},
    createdAt: "2026-10-02T00:00:00.000Z",
  },
];

describe("RecordsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("JSESSIONID=session");
    mocks.getSessionState.mockResolvedValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.list.mockResolvedValue([]);
  });

  it("lists readings by month as rows that open the record", async () => {
    mocks.list.mockResolvedValue(RECORDS);

    await renderRecordsPage();

    expect(mocks.getSessionState).toHaveBeenCalledWith("JSESSIONID=session");
    expect(screen.getByRole("heading", { level: 1, name: "내 기록" })).toBeInTheDocument();
    const november = screen.getByRole("region", { name: "2026년 11월" });
    expect(within(november).getByRole("link", { name: /관계의 흐름/ }))
      .toHaveAttribute("href", "/records/reading-1");
    expect(within(november).getByRole("link", { name: /관계 리딩.*카드 3장/ })).toBeInTheDocument();
    expect(within(november).getByRole("link", { name: /생성 실패 - 시간 초과/ }))
      .toHaveAttribute("href", "/records/reading-2");
    const october = screen.getByRole("region", { name: "2026년 10월" });
    expect(within(october).getByRole("link", { name: /생성 중/ })).toBeInTheDocument();
    expect(screen.queryByText("완료")).not.toBeInTheDocument();
  });

  it("filters by kind through the address and marks the current tab", async () => {
    mocks.list.mockResolvedValue(RECORDS);

    await renderRecordsPage("saju");

    const tabs = screen.getByRole("navigation", { name: "기록 종류" });
    expect(within(tabs).getByRole("link", { name: "전체 3" })).toHaveAttribute("href", "/records");
    expect(within(tabs).getByRole("link", { name: "타로 2" })).not.toHaveAttribute("aria-current");
    expect(within(tabs).getByRole("link", { name: "사주 1" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /생성 실패/ })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /관계의 흐름/ })).not.toBeInTheDocument();
  });

  it("says when a filtered kind has no readings yet", async () => {
    mocks.list.mockResolvedValue([RECORDS[0]]);

    await renderRecordsPage("saju");

    expect(screen.getByText(/사주 리딩이 아직 없어요/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "사주 시작하기" })).toHaveAttribute("href", "/saju");
  });

  it("offers both readings when nothing is saved yet", async () => {
    await renderRecordsPage();

    expect(screen.getByRole("heading", { name: "아직 저장된 리딩이 없어요" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /AI 타로/ })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: /AI 사주/ })).toHaveAttribute("href", "/saju");
    expect(screen.queryByRole("link", { name: /로그인/ })).not.toBeInTheDocument();
  });

  it("does not list a legacy daily AI record", async () => {
    mocks.list.mockResolvedValue([{
      id: "legacy-daily",
      kind: "tarot",
      spreadType: "daily_one_card",
      schemaVersion: 1,
      status: "failed",
      title: "Generating...",
      input: { question: "과거 오늘의 한 장" },
      createdAt: "2026-06-12T00:00:00.000Z",
    }]);

    await renderRecordsPage();

    expect(screen.getByText("아직 저장된 리딩이 없어요")).toBeInTheDocument();
    expect(screen.queryByText("과거 오늘의 한 장")).not.toBeInTheDocument();
  });

  it("does not load records for guests", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unauthenticated", user: null });

    await renderRecordsPage();

    expect(mocks.list).not.toHaveBeenCalled();
  });

  it("creates only a generic retry body when session verification is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable", user: null });

    await renderRecordsPage();

    expect(screen.getByRole("alert")).toHaveTextContent("페이지를 불러오지 못했어요");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.queryByText("아직 저장된 리딩이 없어요")).not.toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
