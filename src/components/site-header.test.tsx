import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, vi } from "vitest";

const navigation = vi.hoisted(() => ({
  pathname: "/tarot",
  search: "spread=three-card",
}));
const credits = vi.hoisted(() => ({
  state: {
    status: "ready" as "ready" | "loading" | "error",
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
    credits.state.status = "ready";
    credits.refresh.mockReset();
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
    expect(screen.getByTitle("오늘 무료 7 · 추가 2")).toBeInTheDocument();
  });

  it("keeps showing the balance while credits refresh", () => {
    credits.state.status = "loading";

    render(<SiteHeader authenticated />);

    expect(screen.getByText("크레딧")).toHaveTextContent("크레딧 9");
    expect(screen.queryByLabelText("크레딧 확인 중")).not.toBeInTheDocument();
  });

  it("offers a retry instead of showing stale credit data after an error", () => {
    credits.state.status = "error";

    render(<SiteHeader authenticated />);
    fireEvent.click(screen.getByRole("button", { name: "크레딧 다시 확인" }));

    expect(screen.queryByText("크레딧 9")).not.toBeInTheDocument();
    expect(credits.refresh).toHaveBeenCalledTimes(1);
  });

  it("offers tarot and saju as menu buttons and marks the section in view", () => {
    navigation.pathname = "/saju/results/reading-1";

    render(<SiteHeader authenticated={false} zodiacYear={2027} />);

    const saju = screen.getByRole("button", { name: "사주" });
    const tarot = screen.getByRole("button", { name: "타로" });
    expect(saju).toHaveClass("active");
    expect(tarot).not.toHaveClass("active");
    expect(saju).toHaveAttribute("aria-expanded", "false");
  });

  it("marks 사주 for pages outside /saju that belong to it, and skips look-alike paths", () => {
    for (const [path, active] of [
      ["/manseryeok", "사주"], ["/zodiac/rat", "사주"], ["/saju/dictionary/elements/wood", "사주"], ["/guide/saju/annual-report", "사주"],
      ["/tarot/daily", "타로"], ["/guide/tarot", "타로"], ["/tarotology", null], ["/faq", null],
    ] as const) {
      navigation.pathname = path;
      const { unmount } = render(<SiteHeader authenticated={false} />);
      expect(screen.getByRole("button", { name: "사주" }).classList.contains("active"), path).toBe(active === "사주");
      expect(screen.getByRole("button", { name: "타로" }).classList.contains("active"), path).toBe(active === "타로");
      unmount();
    }
  });

  it("opens one category at a time with its groups and links, and closes on a second press", () => {
    navigation.pathname = "/";
    render(<SiteHeader authenticated={false} zodiacYear={2027} />);
    const saju = screen.getByRole("button", { name: "사주" });
    const tarot = screen.getByRole("button", { name: "타로" });

    fireEvent.click(saju);
    expect(saju).toHaveAttribute("aria-expanded", "true");
    const panel = document.getElementById(saju.getAttribute("aria-controls")!)!;
    expect(panel).toHaveClass("open");
    expect(within(panel).getAllByRole("link").map((link) => [link.textContent, link.getAttribute("href")])).toEqual([
      ["AI 사주 리딩", "/saju"], ["만세력 계산", "/manseryeok"], ["2027 띠별 신년운세", "/zodiac"],
      ["사주 개념 사전", "/saju/dictionary"], ["사주 사용 가이드", "/guide/saju"], ["한 해 리포트 읽는 법", "/guide/saju/annual-report"],
    ]);
    expect(within(panel).getByText("이용하기")).toBeInTheDocument();
    expect(within(panel).getByText("읽을거리")).toBeInTheDocument();

    fireEvent.click(tarot);
    expect(tarot).toHaveAttribute("aria-expanded", "true");
    expect(saju).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(tarot);
    expect(tarot).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the category menu with Escape (back to its button), an outside press or a followed link", () => {
    navigation.pathname = "/";
    render(<SiteHeader authenticated={false} />);
    const tarot = screen.getByRole("button", { name: "타로" });

    tarot.focus();
    fireEvent.click(tarot);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(tarot).toHaveAttribute("aria-expanded", "false");
    expect(tarot).toHaveFocus();

    // Escape with focus already elsewhere closes the menu but leaves focus where it is.
    const login = screen.getByRole("link", { name: "로그인" });
    fireEvent.click(tarot);
    login.focus();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(tarot).toHaveAttribute("aria-expanded", "false");
    expect(login).toHaveFocus();

    // Tabbing out of the menu closes it.
    tarot.focus();
    fireEvent.click(tarot);
    fireEvent.blur(tarot, { relatedTarget: login });
    expect(tarot).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(tarot);
    fireEvent.pointerDown(document.body);
    expect(tarot).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(tarot);
    fireEvent.click(screen.getByRole("link", { name: "오늘의 운세" }));
    expect(tarot).toHaveAttribute("aria-expanded", "false");
  });

  it("dims the page only while a band is open, keeps its art out of the link names, and closes on the dim", () => {
    navigation.pathname = "/";
    const { container } = render(<SiteHeader authenticated={false} />);
    const saju = screen.getByRole("button", { name: "사주" });
    expect(container.querySelector(".reading-menu-scrim")).toBeNull();
    expect(container.querySelector(".reading-menu-art")).toBeNull();

    fireEvent.click(saju);
    const art = container.querySelector(".reading-menu-art.saju");
    expect(art).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("link", { name: "만세력 계산" })).toBeInTheDocument();

    fireEvent.pointerDown(container.querySelector(".reading-menu-scrim")!);
    expect(saju).toHaveAttribute("aria-expanded", "false");
    expect(container.querySelector(".reading-menu-scrim")).toBeNull();
  });

  it("marks only the most specific link as the current page", () => {
    navigation.pathname = "/saju/dictionary/ten-gods/sanggwan";
    render(<SiteHeader authenticated={false} />);
    fireEvent.click(screen.getByRole("button", { name: "사주" }));
    expect(screen.getByRole("link", { name: "사주 개념 사전" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "AI 사주 리딩" })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("link", { name: "띠별 신년운세" })).toHaveAttribute("href", "/zodiac");
  });

  it("opens the account menu and closes it with Escape or an outside press", () => {
    render(<SiteHeader authenticated />);

    const button = screen.getByRole("button", { name: "계정 메뉴" });
    const panel = document.getElementById("account-menu-panel");
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveAttribute("aria-controls", "account-menu-panel");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(panel).toHaveClass("open");

    fireEvent.keyDown(document, { key: "Escape" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(button).toHaveFocus();

    fireEvent.click(button);
    fireEvent.pointerDown(document.body);
    expect(button).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the account menu once one of its links is followed", () => {
    render(<SiteHeader authenticated />);

    fireEvent.click(screen.getByRole("button", { name: "계정 메뉴" }));
    fireEvent.click(screen.getByRole("link", { name: "내 기록" }));

    expect(screen.getByRole("button", { name: "계정 메뉴" })).toHaveAttribute("aria-expanded", "false");
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
