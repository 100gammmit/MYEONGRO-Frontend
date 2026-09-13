import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  replace: vi.fn(),
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

import { SignupAgeConfirmation } from "./signup-age-confirmation";

describe("SignupAgeConfirmation", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    navigation.replace.mockReset();
    navigation.refresh.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("creates the member only after an adult confirms signup eligibility", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ pending: true, provider: "google" }))
      .mockResolvedValueOnce(Response.json({ next: "/records?tab=latest" }));

    render(<SignupAgeConfirmation />);

    expect(await screen.findByText(/Google 계정은 가입 완료 전까지 임시로만 연결됩니다/))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "만 19세 이상이며 가입합니다" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/signup", {
        method: "POST",
        credentials: "same-origin",
      });
      expect(navigation.replace).toHaveBeenCalledWith("/records?tab=latest");
    });
  });

  it("cancels the pending OAuth connection without creating an underage account", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ pending: true, provider: "kakao" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(<SignupAgeConfirmation />);

    fireEvent.click(await screen.findByRole("button", { name: "만 19세 미만입니다" }));

    expect(await screen.findByText(/MYEONGRO 계정은 생성되지 않았고/)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith("/api/signup", {
      method: "DELETE",
      credentials: "same-origin",
    });
    expect(screen.getByRole("link", { name: "오늘의 운세 보기" })).toHaveAttribute(
      "href",
      "/tarot/daily",
    );
  });

  it("explains when provider-side unlink cannot be confirmed", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ pending: true, provider: "kakao" }))
      .mockResolvedValueOnce(Response.json(
        { message: "외부 계정 연결 해제를 확인하지 못했습니다." },
        { status: 502 },
      ));

    render(<SignupAgeConfirmation />);

    fireEvent.click(await screen.findByRole("button", { name: "가입 취소" }));

    expect(await screen.findByRole("alert"))
      .toHaveTextContent("외부 계정 연결 해제를 확인하지 못했습니다.");
    expect(screen.queryByRole("button", { name: "만 19세 이상이며 가입합니다" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인 화면으로 돌아가기" }))
      .toHaveAttribute("href", "/login");
  });

  it("does not offer signup actions after the Redis waiting session expires", async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));

    render(<SignupAgeConfirmation />);

    expect(await screen.findByText("가입 대기 시간이 만료되었어요.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "만 19세 이상이며 가입합니다" }))
      .not.toBeInTheDocument();
  });
});
