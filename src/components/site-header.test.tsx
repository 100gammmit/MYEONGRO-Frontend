import { render, screen } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  pathname: "/tarot",
  search: "spread=three-card",
}));
const credits = vi.hoisted(() => ({
  state: {
    status: "ready" as const,
    data: {
      balance: { free: 7, paid: 2, total: 9 },
    },
  },
  refresh: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
  useSearchParams: () => new URLSearchParams(navigation.search),
}));

vi.mock("./reading-credit-provider", () => ({
  useReadingCredits: () => credits,
}));

import { SiteHeader } from "./site-header";

describe("SiteHeader", () => {
  beforeEach(() => {
    navigation.pathname = "/tarot";
    navigation.search = "spread=three-card";
  });

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
      "/login?next=%2Ftarot%3Fspread%3Dthree-card",
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
    expect(screen.getByText("크레딧")).toHaveTextContent("크레딧 9");
  });

  it("does not make the login page its own return destination", () => {
    navigation.pathname = "/login";
    navigation.search = "next=%2Fsaju";

    render(<SiteHeader authenticated={false} />);

    expect(screen.getByRole("link", { name: "로그인" })).toHaveAttribute(
      "href",
      "/login",
    );
  });
});
