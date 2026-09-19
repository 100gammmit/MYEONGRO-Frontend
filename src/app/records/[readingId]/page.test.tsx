import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { sajuReadingRecord } from "@/test-fixtures/saju-reading";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionState: vi.fn(),
  get: vi.fn(),
  notFound: vi.fn(() => {
    throw new Error("NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: mocks.notFound,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
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

    get = mocks.get;
  },
}));
import ReadingDetailPage from "./page";

async function renderPage() {
  const Page = ReadingDetailPage as (props: {
    params: Promise<{ readingId: string }>;
  }) => Promise<ReactElement>;
  return render(await Page({
    params: Promise.resolve({ readingId: "reading-1" }),
  }));
}

describe("ReadingDetailPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("JSESSIONID=session");
    mocks.getSessionState.mockResolvedValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
  });

  it("renders a completed structured reading", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "tarot",
      spreadType: "mind_three_card",
      schemaVersion: 2,
      status: "completed",
      title: "관계의 흐름",
      input: {
        cards: [
          { cardId: "major-00-fool", position: "emotion", reversed: false },
          { cardId: "major-06-lovers", position: "underlying_need", reversed: false },
          { cardId: "major-17-star", position: "self_action", reversed: false },
        ],
      },
      result: {
        questionRedirected: false,
        title: "관계의 흐름",
        summary: "천천히 확인할 시기입니다.",
        sections: [
          { position: "emotion", heading: "지금의 감정", body: "감정을 알아차리세요." },
          { position: "underlying_need", heading: "감정 뒤의 욕구", body: "바라는 것을 적어보세요." },
          { position: "self_action", heading: "나를 위한 행동", body: "대화를 이어가세요." },
        ],
        guidance: ["서두르지 마세요."],
        disclaimer: "자기 성찰을 위한 참고 정보입니다.",
      },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });

    await renderPage();

    expect(mocks.getSessionState).toHaveBeenCalledWith("JSESSIONID=session");
    expect(mocks.get).toHaveBeenCalledWith("reading-1");
    expect(screen.getByRole("heading", { name: "관계의 흐름" })).toBeInTheDocument();
    expect(screen.getByText("천천히 확인할 시기입니다.")).toBeInTheDocument();
    expect(screen.getByText("대화를 이어가세요.")).toBeInTheDocument();
    expect(screen.getByText("바보")).toBeInTheDocument();
    expect(screen.getByText("연인")).toBeInTheDocument();
    expect(screen.getByText("별")).toBeInTheDocument();
    expect(screen.queryByText("앞으로 어떻게 흘러갈까요?")).not.toBeInTheDocument();
  });

  it("reopens a saved tarot reading as its result screen with every card face up", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "tarot",
      spreadType: "mind_three_card",
      schemaVersion: 2,
      status: "completed",
      title: "관계의 흐름",
      input: {
        cards: [
          { cardId: "major-00-fool", position: "emotion", reversed: false },
          { cardId: "major-06-lovers", position: "underlying_need", reversed: false },
          { cardId: "major-17-star", position: "self_action", reversed: false },
        ],
      },
      result: {
        questionRedirected: false,
        title: "관계의 흐름",
        summary: "천천히 확인할 시기입니다.",
        sections: [
          { position: "emotion", heading: "지금의 감정", body: "감정을 알아차리세요." },
          { position: "underlying_need", heading: "감정 뒤의 욕구", body: "바라는 것을 적어보세요." },
          { position: "self_action", heading: "나를 위한 행동", body: "대화를 이어가세요." },
        ],
        guidance: ["서두르지 마세요."],
        disclaimer: "자기 성찰을 위한 참고 정보입니다.",
      },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });

    const { container } = await renderPage();

    expect(screen.getByRole("heading", { level: 1, name: "카드가 전하는 메시지" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "← 내 기록" })).toHaveAttribute("href", "/records");
    expect(screen.queryByRole("link", { name: "← 홈으로" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "첫 카드 공개" })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".card-flip-inner")).toHaveLength(3);
    expect(container.querySelectorAll(".card-flip-inner.flipped")).toHaveLength(3);
    expect(container.querySelector(".progress-track")).toBeNull();
    expect(screen.getByText("서두르지 마세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기록 삭제" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "내 기록 보기" })).not.toBeInTheDocument();
  });

  it("renders a completed decline as a saved result without retry", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "saju",
      schemaVersion: 4,
      status: "completed",
      title: "건강에 관한 중요한 결정은 리딩으로 답하기 어려워요",
      input: {},
      result: {
        resultType: "declined",
        reasonCode: "MEDICAL_DECISION",
        title: "건강에 관한 중요한 결정은 리딩으로 답하기 어려워요",
        message: "의료 전문가와 확인해 주세요.",
        guidance: ["불안한 마음을 살펴보는 질문으로 바꿔보세요."],
        disclaimer: "전문적인 의료 조언을 대신하지 않습니다.",
      },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });

    await renderPage();

    expect(screen.getByRole("heading", {
      name: "건강에 관한 중요한 결정은 리딩으로 답하기 어려워요",
    })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "다시 생성" }))
      .not.toBeInTheDocument();
  });

  it("returns not found for an unsupported legacy tarot payload", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "tarot",
      spreadType: null,
      schemaVersion: 0,
      status: "completed",
      title: "이전 타로 리딩",
      input: { question: "이전 질문" },
      result: {
        title: "이전 타로 리딩",
        summary: "레거시 요약",
        sections: [{ heading: "과거", body: "추측하면 안 되는 본문" }],
        guidance: ["레거시 조언"],
        disclaimer: "참고 정보",
      },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(screen.queryByText("추측하면 안 되는 본문")).not.toBeInTheDocument();
  });

  it("selects the saju v5 renderer and restores its calculation context", async () => {
    mocks.get.mockResolvedValue(sajuReadingRecord());

    await renderPage();

    expect(screen.getByRole("heading", { name: "변화를 준비하며 기준을 세우는 해" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "사주 리딩 목차" })).toBeInTheDocument();
    expect(screen.getByText("현재 대운")).toBeInTheDocument();
  });

  it("does not guess-render a malformed saju v5 payload", async () => {
    const malformed = sajuReadingRecord();
    malformed.result.natalSections = malformed.result.natalSections.slice(0, 3);
    mocks.get.mockResolvedValue(malformed);

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("현재 형식으로 표시할 수 없어요");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "저장된 사주 결과를 확인할 수 없어 지금은 표시할 수 없어요.",
    );
    expect(screen.queryByText(/schema version/i)).not.toBeInTheDocument();
    expect(screen.queryByText("중심을 살펴봅니다.")).not.toBeInTheDocument();
  });

  it("sends failed readings back to a fresh question", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "saju",
      status: "failed",
      title: "Generating...",
      input: { focusArea: "career", targetYear: 2026 },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });

    await renderPage();

    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 질문 입력하기" })).toHaveAttribute("href", "/saju");
    expect(screen.queryByText("올해의 흐름이 궁금해요.")).not.toBeInTheDocument();
  });

  it.each(["completed", "failed"] as const)(
    "returns not found for a legacy daily AI record with %s status",
    async (status) => {
      mocks.get.mockResolvedValue({
        id: "legacy-daily",
        kind: "tarot",
        spreadType: "daily_one_card",
        schemaVersion: 1,
        status,
        title: "과거 오늘의 한 장",
        input: { question: "과거 오늘의 한 장" },
        result: status === "completed" ? {
          resultType: "declined",
          reasonCode: "FINANCIAL_DECISION",
          title: "거절된 과거 오늘의 한 장",
          message: "안내 문구",
          guidance: ["다른 질문을 살펴보세요."],
          disclaimer: "참고 정보입니다.",
        } : undefined,
        createdAt: "2026-06-12T00:00:00.000Z",
        updatedAt: "2026-06-12T00:00:01.000Z",
      });

      await expect(renderPage()).rejects.toThrow("NOT_FOUND");
      expect(screen.queryByRole("button", { name: "다시 생성" })).not.toBeInTheDocument();
    },
  );

  it("returns not found for guests", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unauthenticated", user: null });

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("creates only a generic retry body when session verification is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable", user: null });

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("페이지를 불러오지 못했어요");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(mocks.notFound).not.toHaveBeenCalled();
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("returns not found for a foreign or deleted reading", async () => {
    mocks.get.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
  });
});
