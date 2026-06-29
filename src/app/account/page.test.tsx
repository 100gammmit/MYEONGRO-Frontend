import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionUser: vi.fn(),
}));

vi.mock("@/infrastructure/backend/request-cookies", () => ({
  getBackendCookieHeader: mocks.getCookieHeader,
}));
vi.mock("@/infrastructure/backend/session-auth", () => ({
  getSpringSessionUser: mocks.getSessionUser,
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
    mocks.getSessionUser.mockResolvedValue({ id: "user-1" });

    await renderAccountPage();

    expect(mocks.getSessionUser).toHaveBeenCalledWith("JSESSIONID=session");
    expect(screen.getByRole("heading", { name: "계정 설정" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "계정 삭제" })).toBeInTheDocument();
  });

  it("asks guests to log in before account management", async () => {
    mocks.getSessionUser.mockResolvedValue(null);

    await renderAccountPage();

    expect(screen.getByRole("link", { name: "로그인하기" })).toHaveAttribute(
      "href",
      "/login?next=%2Faccount",
    );
    expect(screen.queryByRole("button", { name: "계정 삭제" })).not.toBeInTheDocument();
  });
});
