import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionState: vi.fn(),
  get: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
  result: vi.fn(() => <div>tarot result</div>),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/infrastructure/backend/request-cookies", () => ({
  getBackendCookieHeader: mocks.getCookieHeader,
}));
vi.mock("@/infrastructure/backend/session-auth", () => ({
  getSpringSessionState: mocks.getSessionState,
}));
vi.mock("@/infrastructure/backend/reading-records-client", () => ({
  BackendReadingRecordsClient: class {
    get = mocks.get;
  },
}));
vi.mock("@/components/tarot-reading-result", () => ({
  TarotReadingResult: mocks.result,
}));

import TarotResultPage from "./page";

async function renderPage() {
  const Page = TarotResultPage as (props: {
    params: Promise<{ readingId: string }>;
  }) => Promise<ReactElement>;
  return render(await Page({ params: Promise.resolve({ readingId: "reading-1" }) }));
}

function completedReading() {
  return {
    id: "reading-1",
    kind: "tarot",
    spreadType: "daily_one_card",
    schemaVersion: 1,
    status: "completed",
    title: "오늘의 리딩",
    input: {
      question: "오늘의 흐름",
      cards: [{ cardId: "major-00-fool", position: "today", reversed: false }],
    },
    result: {
      title: "오늘의 리딩",
      summary: "오늘의 흐름을 확인했어요.",
      sections: [{ position: "today", heading: "오늘의 흐름", body: "천천히 살펴보세요." }],
      guidance: ["작은 행동을 시작하세요."],
      disclaimer: "자기 성찰을 위한 참고 정보입니다.",
    },
    createdAt: "2026-07-23T00:00:00Z",
    updatedAt: "2026-07-23T00:00:01Z",
  };
}

describe("TarotResultPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("JSESSIONID=session");
    mocks.getSessionState.mockResolvedValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.get.mockResolvedValue(completedReading());
  });

  it("restores a completed tarot result by reading ID", async () => {
    await renderPage();

    expect(mocks.get).toHaveBeenCalledWith("reading-1");
    expect(mocks.result).toHaveBeenCalledWith(
      expect.objectContaining({
        spreadType: "daily_one_card",
        cardIds: ["major-00-fool"],
      }),
      undefined,
    );
    expect(screen.getByText("tarot result")).toBeInTheDocument();
  });

  it("does not render malformed or non-completed tarot records", async () => {
    mocks.get.mockResolvedValue({ ...completedReading(), schemaVersion: 2 });

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.result).not.toHaveBeenCalled();
  });

  it("shows the generic retry body when session verification is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable", user: null });

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("페이지를 불러오지 못했어요");
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
