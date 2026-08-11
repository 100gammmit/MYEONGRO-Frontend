import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { sajuReadingRecord } from "@/test-fixtures/saju-reading";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionState: vi.fn(),
  get: vi.fn(),
  notFound: vi.fn(() => { throw new Error("NOT_FOUND"); }),
  result: vi.fn(() => <div>saju result</div>),
  declined: vi.fn(() => <div>saju declined result</div>),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));
vi.mock("@/infrastructure/backend/request-cookies", () => ({
  getBackendCookieHeader: mocks.getCookieHeader,
}));
vi.mock("@/infrastructure/backend/session-auth", () => ({
  getSpringSessionState: mocks.getSessionState,
}));
vi.mock("@/infrastructure/backend/reading-records-client", () => ({
  BackendReadingRecordsClient: class { get = mocks.get; },
}));
vi.mock("@/components/saju-reading-result", () => ({
  SajuReadingResult: mocks.result,
}));
vi.mock("@/components/reading-declined-result", () => ({
  ReadingDeclinedResult: mocks.declined,
}));

import SajuResultPage from "./page";

async function renderPage() {
  const Page = SajuResultPage as (props: {
    params: Promise<{ readingId: string }>;
  }) => Promise<ReactElement>;
  return render(await Page({ params: Promise.resolve({ readingId: "reading-1" }) }));
}

describe("SajuResultPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("JSESSIONID=session");
    mocks.getSessionState.mockResolvedValue({
      status: "authenticated",
      user: { id: "user-1" },
    });
    mocks.get.mockResolvedValue(sajuReadingRecord());
  });

  it("restores a completed saju v2 result by reading ID", async () => {
    await renderPage();

    expect(mocks.get).toHaveBeenCalledWith("reading-1");
    expect(mocks.result).toHaveBeenCalledWith(
      expect.objectContaining({
        backHref: "/saju",
        view: expect.objectContaining({ id: "reading-1", schemaVersion: 2 }),
      }),
      undefined,
    );
    expect(screen.getByText("saju result")).toBeInTheDocument();
  });

  it("renders a completed decline before parsing a full saju result", async () => {
    mocks.get.mockResolvedValue({
      id: "reading-1",
      kind: "saju",
      schemaVersion: 2,
      status: "completed",
      title: "건강에 관한 중요한 결정은 리딩으로 답하기 어려워요",
      input: { question: "수술을 받아야 할까요?" },
      result: {
        resultType: "declined",
        reasonCode: "MEDICAL_DECISION",
        title: "건강에 관한 중요한 결정은 리딩으로 답하기 어려워요",
        message: "의료 전문가와 확인해 주세요.",
        guidance: ["감정을 살펴보는 질문으로 바꿔보세요."],
        disclaimer: "전문적인 의료 조언을 대신하지 않습니다.",
      },
    });

    await renderPage();

    expect(mocks.declined).toHaveBeenCalled();
    expect(mocks.result).not.toHaveBeenCalled();
    expect(screen.getByText("saju declined result")).toBeInTheDocument();
  });

  it("does not guess-render unsupported or malformed saju records", async () => {
    mocks.get.mockResolvedValue(sajuReadingRecord({ schemaVersion: 3 }));

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.result).not.toHaveBeenCalled();
  });

  it("shows a generic retry body when session or backend verification is unavailable", async () => {
    mocks.get.mockRejectedValue(new Error("BACKEND_UNAVAILABLE"));

    await renderPage();

    expect(screen.getByRole("alert")).toHaveTextContent("페이지를 불러오지 못했어요");
    expect(mocks.notFound).not.toHaveBeenCalled();
  });

  it("returns not found for guests without reading the record", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unauthenticated", user: null });

    await expect(renderPage()).rejects.toThrow("NOT_FOUND");
    expect(mocks.get).not.toHaveBeenCalled();
  });
});
