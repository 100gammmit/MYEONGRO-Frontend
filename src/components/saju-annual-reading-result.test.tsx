import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { annualView } from "@/domain/saju/annual-fixture.test-helper";
import { SajuAnnualReadingResult } from "./saju-annual-reading-result";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", "/");
});

// The synthetic fixture uses one year pillar for the whole year; this marks January as before Ipchun.
function viewWithPreviousYearInJanuary(brief = false) {
  const view = annualView(brief);
  view.input.calculationSnapshot.monthlyCalendar.months[0].periods[0].yearGanZhi = "丙午";
  return view;
}

function stubScreen(matches: boolean) {
  vi.stubGlobal("matchMedia", (query: string) => ({ matches: query.includes("max-width") ? matches : false }));
  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => { callback(0); return 0; });
  const scrollIntoView = vi.fn();
  Element.prototype.scrollIntoView = scrollIntoView;
  return scrollIntoView;
}

describe("annual month navigation", () => {
  it("restores a month and shares the previous month's period without a request", () => {
    window.history.replaceState(null, "", "/saju/results/synthetic?month=2");
    render(<SajuAnnualReadingResult view={annualView()} />);
    expect(screen.getByRole("button", { name: /2월 · 선택됨/ })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/앞달 후반과 이어지는 구간/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /^12월/ }));
    expect(window.location.search).toBe("?month=12");
    expect(screen.getByRole("heading", { name: "12월 · 12월의 흐름" })).toBeInTheDocument();
    expect(screen.getByText("내 사주 탐색 · 명식과 계산 기준 보기").closest("details")).not.toHaveAttribute("open");
  });

  it("brief mode lists the computed intervals instead of empty period blocks", () => {
    window.history.replaceState(null, "", "/saju/results/synthetic?month=2");
    render(<SajuAnnualReadingResult view={annualView(true)} />);
    expect(screen.getByText(/간략형으로 제공합니다/)).toBeInTheDocument();
    const intervals = screen.getByRole("region", { name: "2월 적용 구간" });
    expect(within(intervals).getAllByRole("listitem")).toHaveLength(2);
    expect(screen.queryByRole("heading", { name: /^절입 전/ })).not.toBeInTheDocument();
    expect(screen.queryByText(/같은 구간의 해석을 함께/)).not.toBeInTheDocument();
    expect(screen.queryByText(/p01 구간을 살펴봅니다/)).not.toBeInTheDocument();
  });

  it("shows dates without seconds, years or internal versions and keeps stems in the calculation details", () => {
    window.history.replaceState(null, "", "/saju/results/synthetic?month=3");
    const { container } = render(<SajuAnnualReadingResult view={annualView()} />);
    const detail = screen.getByRole("region", { name: /3월 ·/ });
    expect(detail).toHaveTextContent("3월 1일부터 3월 5일 전까지");
    expect(detail).not.toHaveTextContent(/\d{2}:\d{2}:\d{2}|2027년|연간지|월간지/);
    expect(container).not.toHaveTextContent(/saju-ko-v4|saju-monthly-ko-v1|계산 규칙/);
    const details = screen.getByText("내 사주 탐색 · 명식과 계산 기준 보기").closest("details");
    expect(details).toHaveTextContent("3월의 계산값");
    expect(details).toHaveTextContent("3월 절입 전연간지 丁未 · 월간지 흐름2");
  });

  it("explains a year pillar before Ipchun only where it applies", () => {
    window.history.replaceState(null, "", "/saju/results/synthetic?month=1");
    render(<SajuAnnualReadingResult view={viewWithPreviousYearInJanuary()} />);
    expect(screen.getAllByText(/입춘 전이라 사주에서는 아직 지난해에 속합니다/)).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: /^3월/ }));
    expect(screen.queryByText(/입춘 전이라/)).not.toBeInTheDocument();
  });

  it("brings the detail into view after choosing a month on a small screen only", () => {
    const scrollIntoView = stubScreen(true);
    render(<SajuAnnualReadingResult view={annualView()} />);
    expect(scrollIntoView).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /^5월/ }));
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    cleanup();

    const desktopScroll = stubScreen(false);
    render(<SajuAnnualReadingResult view={annualView()} />);
    fireEvent.click(screen.getByRole("button", { name: /^5월/ }));
    expect(desktopScroll).not.toHaveBeenCalled();
  });
});
