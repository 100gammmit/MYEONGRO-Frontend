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
  declined: vi.fn(() => <div>declined result</div>),
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
vi.mock("@/components/reading-declined-result", () => ({
  ReadingDeclinedResult: mocks.declined,
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
    spreadType: "mind_three_card",
    schemaVersion: 1,
    status: "completed",
    title: "오늘의 리딩",
    input: {
      question: "오늘의 흐름",
      cards: [
        { cardId: "major-00-fool", position: "emotion", reversed: false },
        { cardId: "major-01-magician", position: "underlying_need", reversed: false },
        { cardId: "major-02-high-priestess", position: "self_action", reversed: false },
      ],
    },
    result: {
      title: "오늘의 리딩",
      summary: "오늘의 흐름을 확인했어요.",
      sections: [
        { position: "emotion", heading: "지금의 감정", body: "감정을 살펴봐요." },
        { position: "underlying_need", heading: "감정 뒤의 욕구", body: "바라는 점을 살펴봐요." },
        { position: "self_action", heading: "나를 위한 행동", body: "작은 행동을 살펴봐요." },
      ],
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
        spreadType: "mind_three_card",
        cardIds: ["major-00-fool", "major-01-magician", "major-02-high-priestess"],
      }),
      undefined,
    );
    expect(screen.getByText("tarot result")).toBeInTheDocument();
  });

  it("renders a completed decline result without requiring tarot sections", async () => {
    const reading = completedReading();
    reading.result = {
      resultType: "declined",
      reasonCode: "FINANCIAL_DECISION",
      title: "큰 재정 결정을 리딩으로 정해 드리기는 어려워요",
      message: "객관적인 정보를 함께 확인해 주세요.",
      guidance: ["질문을 자기 점검의 관점으로 바꿔보세요."],
      disclaimer: "전문적인 금융 조언을 대신하지 않습니다.",
    } as unknown as typeof reading.result;
    mocks.get.mockResolvedValue(reading);

    await renderPage();

    expect(mocks.declined).toHaveBeenCalled();
    expect(mocks.result).not.toHaveBeenCalled();
    expect(screen.getByText("declined result")).toBeInTheDocument();
  });

  it("does not render a saju decline on the tarot result route", async () => {
    const reading = completedReading();
    mocks.get.mockResolvedValue({
      ...reading,
      kind: "saju",
      spreadType: null,
      result: {
        resultType: "declined",
        reasonCode: "MEDICAL_DECISION",
        title: "건강에 관한 중요한 결정은 리딩으로 답하기 어려워요",
        message: "의료 전문가와 확인해 주세요.",
        guidance: ["감정을 살펴보는 질문으로 바꿔보세요."],
        disclaimer: "전문적인 의료 조언을 대신하지 않습니다.",
      },
    });

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.declined).not.toHaveBeenCalled();
    expect(mocks.result).not.toHaveBeenCalled();
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

  it("shows the generic retry body when the reading request is unavailable", async () => {
    mocks.get.mockRejectedValue(new Error("BACKEND_UNAVAILABLE"));

    await renderPage();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it.each([null, undefined])(
    "treats a malformed %s input as not found",
    async (input) => {
      mocks.get.mockResolvedValue({ ...completedReading(), input });

      await expect(renderPage()).rejects.toThrow("NOT_FOUND");
      expect(mocks.result).not.toHaveBeenCalled();
    },
  );
});
