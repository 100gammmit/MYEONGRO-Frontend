import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/auth-buttons", () => ({
  AuthButtons: () => <button type="button">카카오로 계속</button>,
}));

import LoginPage from "./page";

describe("LoginPage", () => {
  it("explains record storage and cross-device access", async () => {
    render(await LoginPage({ searchParams: Promise.resolve({}) }));

    expect(
      screen.getByText("로그인하면 리딩 기록을 안전하게 저장하고 다른 기기에서도 이어서 볼 수 있습니다."),
    ).toBeInTheDocument();
    expect(screen.getByText("카카오 또는 Google 계정으로 간편하게 시작할 수 있어요."))
      .toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it.each([
    ["rate-limited", "로그인 요청이 많아 잠시 제한됐어요."],
    ["signup-limited", "이 네트워크에서 가입 요청이 많았어요."],
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
