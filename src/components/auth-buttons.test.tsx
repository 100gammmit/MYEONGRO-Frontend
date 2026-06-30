import { render, screen } from "@testing-library/react";

import { AuthButtons } from "./auth-buttons";

describe("AuthButtons", () => {
  it("links Kakao and Google to the frontend Spring OAuth redirect routes with a local next path", () => {
    render(<AuthButtons next="/records/reading-1?tab=detail" />);

    expect(screen.getByRole("link", { name: "카카오로 계속하기" })).toHaveAttribute(
      "href",
      "/auth/login/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
    expect(screen.getByRole("link", { name: "Google로 계속하기" })).toHaveAttribute(
      "href",
      "/auth/login/google?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );

    expect(screen.getByTestId("kakao-login-logo")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByTestId("google-login-logo")).toHaveAttribute("aria-hidden", "true");
  });
});
