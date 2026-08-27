import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionState: vi.fn(),
}));

vi.mock("@/infrastructure/backend/request-cookies", () => ({
  getBackendCookieHeader: mocks.getCookieHeader,
}));
vi.mock("@/infrastructure/backend/session-auth", () => ({
  getSpringSessionState: mocks.getSessionState,
}));
vi.mock("@/components/daily-card-experience", () => ({
  DailyCardExperience: ({ storageScope }: { storageScope: string | null }) => (
    <div>{storageScope ?? "memory-only"}</div>
  ),
}));

import DailyTarotPage from "./page";

async function renderPage() {
  const Page = DailyTarotPage as () => Promise<ReactElement>;
  return render(await Page());
}

describe("DailyTarotPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("SESSION=session");
  });

  it("uses guest storage for an unauthenticated visitor", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unauthenticated", user: null });

    await renderPage();

    expect(mocks.getSessionState).toHaveBeenCalledWith("SESSION=session");
    expect(screen.getByText("guest")).toBeInTheDocument();
  });

  it("uses account-specific storage for an authenticated user", async () => {
    mocks.getSessionState.mockResolvedValue({
      status: "authenticated",
      user: { id: "11111111-1111-4111-8111-111111111111" },
    });

    await renderPage();

    expect(screen.getByText("user:11111111-1111-4111-8111-111111111111"))
      .toBeInTheDocument();
  });

  it("does not fall back to guest storage when session verification is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable", user: null });

    await renderPage();

    expect(screen.getByText("memory-only")).toBeInTheDocument();
    expect(screen.queryByText("guest")).not.toBeInTheDocument();
  });
});
