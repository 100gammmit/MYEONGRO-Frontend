import { render, screen } from "@testing-library/react";

import { AuthButtons } from "./auth-buttons";

describe("AuthButtons", () => {
  it("starts social login directly and preserves the requested destination", () => {
    render(<AuthButtons next="/records/reading-1?tab=detail" />);

    expect(screen.getByRole("link", { name: "카카오로 계속하기" })).toHaveAttribute(
      "href",
      "/auth/login/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
    expect(screen.getByRole("link", { name: "Google로 계속하기" })).toHaveAttribute(
      "href",
      "/auth/login/google?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
    expect(screen.queryByText(/만 19세/)).not.toBeInTheDocument();
    expect(screen.getByTestId("kakao-login-logo")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("google-login-logo")).toHaveAttribute("aria-hidden", "true");
  });
});
