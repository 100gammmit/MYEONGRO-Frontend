import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserId: vi.fn(),
  getAccessToken: vi.fn(),
  list: vi.fn(),
}));

vi.mock("@/infrastructure/supabase/auth", () => ({
  getAuthenticatedUserId: mocks.getUserId,
  getAuthenticatedAccessToken: mocks.getAccessToken,
}));
vi.mock("@/infrastructure/backend/reading-records-client", () => ({
  BackendReadingRecordsClient: class {
    list = mocks.list;
  },
}));

import RecordsPage from "./page";

type RecordsSearchParams = {
  guestTransfer?: string;
};

async function renderRecordsPage(searchParams: RecordsSearchParams = {}) {
  const Page = RecordsPage as (props: {
    searchParams: Promise<RecordsSearchParams>;
  }) => Promise<ReactElement>;

  return render(await Page({ searchParams: Promise.resolve(searchParams) }));
}

describe("RecordsPage", () => {
  beforeEach(() => {
    mocks.getUserId.mockResolvedValue("user-1");
    mocks.getAccessToken.mockResolvedValue("access-token");
    mocks.list.mockResolvedValue([]);
  });

  it("shows a safe alert when guest transfer failed", async () => {
    await renderRecordsPage({ guestTransfer: "failed" });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("로그인은 완료했지만 이전 기록 연결에 실패했어요.");
  });

  it("renders active owner readings with status and detail links", async () => {
    mocks.list.mockResolvedValue([
      {
        id: "reading-1",
        kind: "tarot",
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

    expect(mocks.list).toHaveBeenCalledWith("access-token");
    expect(screen.getByRole("link", { name: /관계의 흐름/ })).toHaveAttribute(
      "href",
      "/records/reading-1",
    );
    expect(screen.getByText("완료")).toBeInTheDocument();
    expect(screen.getByText("재시도 필요")).toBeInTheDocument();
  });

  it("shows an authenticated empty state without another login prompt", async () => {
    await renderRecordsPage();

    expect(screen.getByText("아직 저장된 이야기가 없어요")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /로그인/ })).not.toBeInTheDocument();
  });
});
