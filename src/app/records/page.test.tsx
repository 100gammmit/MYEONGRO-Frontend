import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { TAROT_SPREADS } from "@/domain/tarot";

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

async function renderRecordsPage() {
  const Page = RecordsPage as (props: {
    searchParams: Promise<Record<string, never>>;
  }) => Promise<ReactElement>;

  return render(await Page({ searchParams: Promise.resolve({}) }));
}

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

  it("renders active owner readings with status and detail links", async () => {
    mocks.list.mockResolvedValue([
      {
        id: "reading-1",
        kind: "tarot",
        spreadType: "relationship_three_card",
        schemaVersion: 1,
        status: "completed",
        title: "관계의 흐름",
        input: { question: "앞으로의 관계 흐름이 궁금해요." },
        createdAt: "2026-06-12T00:00:00.000Z",
      },
      {
        id: "reading-2",
        kind: "saju",
        status: "failed",
        title: "Generating...",
        input: { question: "올해 일의 흐름이 궁금해요." },
        createdAt: "2026-06-11T00:00:00.000Z",
      },
    ]);

    await renderRecordsPage();

    expect(mocks.getSessionState).toHaveBeenCalledWith("JSESSIONID=session");
    expect(mocks.list).toHaveBeenCalledWith();
    expect(screen.getByRole("link", { name: /관계의 흐름/ })).toHaveAttribute(
      "href",
      "/records/reading-1",
    );
    expect(screen.getByText(TAROT_SPREADS.relationship_three_card.name)).toBeInTheDocument();
  });

  it("shows an authenticated empty state without another login prompt", async () => {
    await renderRecordsPage();

    expect(screen.queryByRole("link", { name: /로그인/ })).not.toBeInTheDocument();
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
    expect(screen.queryByText("아직 저장된 이야기가 없어요")).not.toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalled();
  });
});
