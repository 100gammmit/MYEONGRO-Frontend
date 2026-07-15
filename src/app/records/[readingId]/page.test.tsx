import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionUser: vi.fn(),
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
  getSpringSessionUser: mocks.getSessionUser,
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
    mocks.getSessionUser.mockResolvedValue({ id: "user-1" });
  });

  it("renders a completed structured reading", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "tarot",
      spreadType: "mind_three_card",
      schemaVersion: 1,
      status: "completed",
      title: "관계의 흐름",
      input: {
        question: "앞으로 어떻게 흘러갈까요?",
        cards: [
          { cardId: "major-00-fool", position: "emotion", reversed: false },
          { cardId: "major-06-lovers", position: "underlying_need", reversed: false },
          { cardId: "major-17-star", position: "self_action", reversed: false },
        ],
      },
      result: {
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

    expect(mocks.getSessionUser).toHaveBeenCalledWith("JSESSIONID=session");
    expect(mocks.get).toHaveBeenCalledWith("reading-1");
    expect(screen.getByRole("heading", { name: "관계의 흐름" })).toBeInTheDocument();
    expect(screen.getByText("천천히 확인할 시기입니다.")).toBeInTheDocument();
    expect(screen.getByText("대화를 이어가세요.")).toBeInTheDocument();
    expect(screen.getByText("바보")).toBeInTheDocument();
    expect(screen.getByText("연인")).toBeInTheDocument();
    expect(screen.getByText("별")).toBeInTheDocument();
  });

  it("does not guess-render a legacy tarot payload", async () => {
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

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("새 타로 결과 형식으로 표시할 수 없어요");
    expect(screen.queryByText("추측하면 안 되는 본문")).not.toBeInTheDocument();
  });

  it("shows retry only for failed readings", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "saju",
      status: "failed",
      title: "Generating...",
      input: { question: "올해의 흐름이 궁금해요." },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });

    await renderPage();

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("returns not found for guests", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.get).not.toHaveBeenCalled();
  });

  it("returns not found for a foreign or deleted reading", async () => {
    mocks.get.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
  });
});
