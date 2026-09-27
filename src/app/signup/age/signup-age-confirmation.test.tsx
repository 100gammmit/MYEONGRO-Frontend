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
import { TERMS_DOCUMENT_VERSION } from "@/domain/consent/documents";

describe("SignupAgeConfirmation", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    navigation.replace.mockReset();
    navigation.refresh.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("creates the member only after age and terms confirmations", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ pending: true, provider: "google" }))
      .mockResolvedValueOnce(Response.json({ next: "/records?tab=latest" }));

    render(<SignupAgeConfirmation />);

    expect(await screen.findByText(/Google 계정은 가입 완료 전까지 임시로만 연결됩니다/))
      .toBeInTheDocument();
    const submitButton = screen.getByRole("button", { name: "확인하고 가입하기" });
    expect(submitButton).toBeDisabled();
    fireEvent.click(submitButton);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("checkbox", { name: /만 19세 이상임을 확인합니다/ }));
    expect(submitButton).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "서비스 이용약관 동의 내용 확인" }));
    expect(screen.getByRole("dialog", { name: "서비스 이용약관 동의" })).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`문서 버전 ${TERMS_DOCUMENT_VERSION}`)))
      .toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", {
      name: "서비스 이용약관 동의 확인하고 동의",
    }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    expect(submitButton).toBeEnabled();
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/signup", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          adultEligibilityConfirmed: true,
          termsAccepted: true,
          termsVersion: TERMS_DOCUMENT_VERSION,
        }),
      });
      expect(navigation.replace).toHaveBeenCalledWith("/records?tab=latest");
    });
  });

  it("cancels the pending OAuth connection without creating an account", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ pending: true, provider: "kakao" }))
      .mockResolvedValueOnce(new Response(null, { status: 204 }));

    render(<SignupAgeConfirmation />);

    fireEvent.click(await screen.findByRole("button", { name: "가입 취소" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenLastCalledWith("/api/signup", {
        method: "DELETE",
        credentials: "same-origin",
      });
      expect(navigation.replace).toHaveBeenCalledWith("/login");
    });
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
    expect(screen.queryByRole("button", { name: "확인하고 가입하기" }))
      .not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "로그인 화면으로 돌아가기" }))
      .toHaveAttribute("href", "/login");
  });

  it("does not offer signup actions after the Redis waiting session expires", async () => {
    fetchMock.mockResolvedValueOnce(Response.json(
      { code: "SIGNUP_ATTEMPT_EXPIRED" },
      { status: 410 },
    ));

    render(<SignupAgeConfirmation />);

    expect(await screen.findByText("가입 대기 시간이 만료되었어요.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "확인하고 가입하기" }))
      .not.toBeInTheDocument();
  });

  it("shows the expired state when a completion mutation finds an expired attempt", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ pending: true, provider: "google" }))
      .mockResolvedValueOnce(Response.json(
        { code: "SIGNUP_ATTEMPT_EXPIRED" },
        { status: 410 },
      ))
      .mockResolvedValueOnce(new Response(null, { status: 401 }));

    render(<SignupAgeConfirmation />);

    await acceptRequiredSignupConfirmations();
    fireEvent.click(screen.getByRole("button", { name: "확인하고 가입하기" }));

    expect(await screen.findByText("가입 대기 시간이 만료되었어요.")).toBeInTheDocument();
  });

  it("recovers a completed signup when the first completion response is lost", async () => {
    fetchMock
      .mockResolvedValueOnce(Response.json({ pending: true, provider: "google" }))
      .mockRejectedValueOnce(new TypeError("response lost"))
      .mockResolvedValueOnce(Response.json({
        pending: false,
        completed: true,
        next: "/records?tab=latest",
      }));

    render(<SignupAgeConfirmation />);

    await acceptRequiredSignupConfirmations();
    fireEvent.click(screen.getByRole("button", { name: "확인하고 가입하기" }));

    await waitFor(() => {
      expect(navigation.replace).toHaveBeenCalledWith("/records?tab=latest");
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  it("explains that overseas transfer consent is deferred until AI use", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ pending: true, provider: "google" }));

    render(<SignupAgeConfirmation />);

    expect(await screen.findByText(/AI 타로·사주 리딩을 처음 생성할 때/))
      .toHaveTextContent("OpenAI 국외이전 동의를 별도로 요청합니다");
    expect(screen.queryByRole("button", { name: /국외이전 동의 내용 확인/ }))
      .not.toBeInTheDocument();
  });
});

async function acceptRequiredSignupConfirmations() {
  fireEvent.click(await screen.findByRole("checkbox", {
    name: /만 19세 이상임을 확인합니다/,
  }));
  fireEvent.click(screen.getByRole("button", { name: "서비스 이용약관 동의 내용 확인" }));
  fireEvent.click(screen.getByRole("button", {
    name: "서비스 이용약관 동의 확인하고 동의",
  }));
  await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
}
