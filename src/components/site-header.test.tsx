import { render, screen } from "@testing-library/react";
import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  it("renders the Myeongro brand", () => {
    render(<SiteHeader authenticated={false} />);

    expect(screen.getByRole("link", { name: "명로 홈" })).toHaveTextContent(
      "명로",
    );
  });

  it("offers login to guests without exposing records", () => {
    render(<SiteHeader authenticated={false} />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(screen.queryByRole("link", { name: "내 기록" })).not.toBeInTheDocument();
  });

  it("offers records and logout to authenticated users", () => {
    render(<SiteHeader authenticated />);

    expect(screen.getByRole("link", { name: "내 기록" })).toHaveAttribute(
      "href",
      "/records",
    );
    expect(screen.getByRole("link", { name: "계정" })).toHaveAttribute(
      "href",
      "/account",
    );
    expect(screen.getByRole("button", { name: "로그아웃" })).toBeInTheDocument();
  });
});
