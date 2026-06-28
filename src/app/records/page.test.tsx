import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionUser: vi.fn(),
  list: vi.fn(),
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
    mocks.getSessionUser.mockResolvedValue({ id: "user-1" });
    mocks.list.mockResolvedValue([]);
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

    expect(mocks.getSessionUser).toHaveBeenCalledWith("JSESSIONID=session");
    expect(mocks.list).toHaveBeenCalledWith();
    expect(screen.getByRole("link", { name: /관계의 흐름/ })).toHaveAttribute(
      "href",
      "/records/reading-1",
    );
  });

  it("shows an authenticated empty state without another login prompt", async () => {
    await renderRecordsPage();

    expect(screen.queryByRole("link", { name: /로그인/ })).not.toBeInTheDocument();
  });

  it("does not load records for guests", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await renderRecordsPage();

    expect(mocks.list).not.toHaveBeenCalled();
  });
});
