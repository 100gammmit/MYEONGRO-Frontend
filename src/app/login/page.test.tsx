import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getCookieHeader: vi.fn(),
  getSessionState: vi.fn(),
  redirect: vi.fn((path: string) => {
    throw new Error(`NEXT_REDIRECT ${path}`);
  }),
}));

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/infrastructure/backend/request-cookies", () => ({
  getBackendCookieHeader: mocks.getCookieHeader,
}));
vi.mock("@/infrastructure/backend/session-auth", () => ({
  getSpringSessionState: mocks.getSessionState,
}));
vi.mock("@/components/auth-buttons", () => ({
  AuthButtons: ({ next }: { next: string }) => <button data-next={next} type="button">카카오로 계속</button>,
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.getCookieHeader.mockResolvedValue("JSESSIONID=session");
    mocks.getSessionState.mockResolvedValue({ status: "unauthenticated", user: null });
  });

  it("explains record storage and what follows a first login", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("heading", { level: 1, name: "로그인" })).toBeInTheDocument();
    expect(screen.getByText(/리딩이 기록에 저장되고, 다른 기기에서도 이어서 볼 수 있어요/)).toBeInTheDocument();
    expect(screen.getByText(/연령과 이용약관을 확인하는 단계/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "카카오로 계속" })).toHaveAttribute("data-next", "/records");
    expect(screen.queryByText(/리딩으로 돌아가요/)).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["/tarot", "고르던 타로 리딩으로 돌아가요"],
    ["/saju?step=birth", "고르던 사주 리딩으로 돌아가요"],
  ])("tells a reader interrupted at %s that the reading waits", async (next, message) => {
    render(await LoginPage({ searchParams: Promise.resolve({ next }) }));

    expect(screen.getByText(new RegExp(message))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "카카오로 계속" })).toHaveAttribute("data-next", next);
  });

  it("does not treat a lookalike path as a reading", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ next: "/tarotish" }) }));

    expect(screen.queryByText(/리딩으로 돌아가요/)).not.toBeInTheDocument();
  });

  it("sends someone already signed in to where the login would have gone", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "authenticated", user: { id: "user-1" } });

    await expect(LoginPage({ searchParams: Promise.resolve({}) })).rejects.toThrow("NEXT_REDIRECT /records");
    await expect(LoginPage({ searchParams: Promise.resolve({ next: "/saju" }) }))
      .rejects.toThrow("NEXT_REDIRECT /saju");
    await expect(LoginPage({ searchParams: Promise.resolve({ next: "//evil.example" }) }))
      .rejects.toThrow("NEXT_REDIRECT /records");
    await expect(LoginPage({ searchParams: Promise.resolve({ next: "/login?next=%2Flogin" }) }))
      .rejects.toThrow("NEXT_REDIRECT /records");
    expect(mocks.getSessionState).toHaveBeenCalledWith("JSESSIONID=session");
  });

  it("still shows the login screen when the session check is unavailable", async () => {
    mocks.getSessionState.mockResolvedValue({ status: "unavailable", user: null });

    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(mocks.redirect).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "카카오로 계속" })).toBeInTheDocument();
  });

  it.each([
    ["rate-limited", "로그인 요청이 많아 잠시 제한됐어요."],
    ["signup-eligibility-missing", "로그인을 완료하지 못했어요."],
  ])("explains the %s redirect", async (reason, message) => {
    render(await LoginPage({ searchParams: Promise.resolve({ reason }) }));

    expect(screen.getByRole("alert")).toHaveTextContent(message);
  });

  it("ignores a reason the backend never sends", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({ reason: "constructor" }) }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
