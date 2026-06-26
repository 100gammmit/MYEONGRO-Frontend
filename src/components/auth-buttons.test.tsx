import { render, screen } from "@testing-library/react";

import { AuthButtons } from "./auth-buttons";

describe("AuthButtons", () => {
  it("links to the frontend Spring OAuth redirect route with a local next path", () => {
    render(<AuthButtons next="/records/reading-1?tab=detail" />);

    expect(screen.getByRole("link", { name: "카카오로 계속하기" })).toHaveAttribute(
      "href",
      "/auth/login/kakao?next=%2Frecords%2Freading-1%3Ftab%3Ddetail",
    );
  });

  it("does not expose Google login", () => {
    render(<AuthButtons next="/records" />);

    expect(screen.queryByRole("button", { name: /google/i })).not.toBeInTheDocument();
  });
});
