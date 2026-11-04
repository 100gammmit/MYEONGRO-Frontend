import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { annualView } from "@/domain/saju/annual-fixture.test-helper";
import { SajuAnnualReadingResult } from "./saju-annual-reading-result";

afterEach(() => { cleanup(); window.history.replaceState(null, "", "/"); });
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
  it("brief mode shows computed intervals without long period interpretations or a fake question", () => {
    render(<SajuAnnualReadingResult view={annualView(true)} />);
    expect(screen.getByText(/간략형으로 제공합니다/)).toBeInTheDocument();
    expect(screen.queryByText(/같은 구간의 해석을 함께/)).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { pressed: false }).length).toBeGreaterThanOrEqual(11);
    expect(screen.queryByText(/p01 구간을 살펴봅니다/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "절입 전 · 적용 구간" })).toBeInTheDocument();
  });
});
