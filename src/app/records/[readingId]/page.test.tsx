import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  getAccessToken: vi.fn(),
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
vi.mock("@/infrastructure/supabase/auth", () => ({
  getAuthenticatedUserId: mocks.getUserId,
  getAuthenticatedAccessToken: mocks.getAccessToken,
}));
vi.mock("@/infrastructure/backend/reading-records-client", () => ({
  BackendReadingRecordsClient: class {
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
    mocks.getUserId.mockResolvedValue("user-1");
    mocks.getAccessToken.mockResolvedValue("access-token");
  });

  it("renders a completed structured reading", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "tarot",
      status: "completed",
      title: "관계의 흐름",
      input: { question: "앞으로 어떻게 흘러갈까요?" },
      result: {
        title: "관계의 흐름",
        summary: "천천히 확인할 시기입니다.",
        sections: [{ heading: "현재", body: "대화를 이어가세요." }],
        guidance: ["서두르지 마세요."],
        disclaimer: "자기 성찰을 위한 참고 정보입니다.",
      },
      createdAt: "2026-06-12T00:00:00.000Z",
      updatedAt: "2026-06-12T00:00:01.000Z",
    });

    await renderPage();

    expect(screen.getByRole("heading", { name: "관계의 흐름" })).toBeInTheDocument();
    expect(screen.getByText("천천히 확인할 시기입니다.")).toBeInTheDocument();
    expect(screen.getByText("대화를 이어가세요.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기록 삭제" })).toBeInTheDocument();
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

    expect(screen.getByText("리딩 생성에 실패했어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "다시 생성" })).toBeInTheDocument();
  });

  it("returns not found for a foreign or deleted reading", async () => {
    mocks.get.mockResolvedValue(null);

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
  });
});
