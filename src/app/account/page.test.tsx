import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

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
vi.mock("./account-delete-button", () => ({
  AccountDeleteButton: () => <button type="button">계정 삭제</button>,
}));

import AccountPage from "./page";

async function renderAccountPage() {
  const Page = AccountPage as () => Promise<ReactElement>;
  return render(await Page());
}

describe("AccountPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("JSESSIONID=session");
  });

  it("shows the account deletion control for authenticated users", async () => {
    mocks.getSessionState.mockResolvedValue({
      status: "authenticated",
      user: { id: "user-1" },
    });

    await renderAccountPage();

    expect(mocks.getSessionState).toHaveBeenCalledWith("JSESSIONID=session");
    expect(screen.getByRole("heading", { name: "계정 설정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정 삭제" })).toBeInTheDocument();
  });

  it("asks guests to log in before account management", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unauthenticated", user: null });

    await renderAccountPage();

    expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
      "href",
      "/login?next=%2Faccount",
    );
    expect(screen.queryByRole("button", { name: "계정 삭제" })).not.toBeInTheDocument();
  });

  it("creates only a generic retry body when session verification is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable", user: null });

    const Page = AccountPage as () => Promise<ReactElement | null>;
    render(await Page());

    expect(screen.getByRole("alert")).toHaveTextContent("페이지를 불러오지 못했어요");
    expect(screen.getByRole("button", { name: "다시 시도" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "로그인하기" })).not.toBeInTheDocument();
  });
});
