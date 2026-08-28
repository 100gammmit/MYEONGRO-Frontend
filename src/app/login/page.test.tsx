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
  });
});
