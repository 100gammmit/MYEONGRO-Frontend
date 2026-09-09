import { fireEvent, render, screen } from "@testing-library/react";

import { AuthButtons } from "./auth-buttons";

describe("AuthButtons", () => {
  it("keeps OAuth providers hidden until the user confirms they are at least 19", () => {
    render(<AuthButtons next="/records/reading-1?tab=detail" />);

    expect(screen.getByRole("button", { name: "만 19세 이상입니다" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "카카오로 계속하기" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "만 19세 이상입니다" }));

    expect(screen.getByRole("link", { name: "카카오로 계속하기" })).toHaveAttribute(
      "href",
      "/auth/login/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail&adultEligibility=confirmed",
    );
    expect(screen.getByRole("link", { name: "Google로 계속하기" })).toHaveAttribute(
      "href",
      "/auth/login/google?next=%2Frecords%2Freading-1%3Ftab%3Ddetail&adultEligibility=confirmed",
    );

    expect(screen.getByTestId("kakao-login-logo")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("google-login-logo")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not start OAuth for a user who says they are under 19", () => {
    render(<AuthButtons />);

    fireEvent.click(screen.getByRole("button", { name: "만 19세 미만입니다" }));

    expect(screen.getByRole("status")).toHaveTextContent(
      "회원 및 AI 리딩 서비스는 만 19세 이상만 이용할 수 있어요.",
    );
    expect(screen.getByRole("link", { name: "오늘의 운세 보기" })).toHaveAttribute(
      "href",
      "/tarot/daily",
    );
    expect(screen.queryByRole("link", { name: "카카오로 계속하기" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "연령 선택 다시 하기" }));
    expect(screen.getByRole("button", { name: "만 19세 이상입니다" })).toBeInTheDocument();
  });
});
