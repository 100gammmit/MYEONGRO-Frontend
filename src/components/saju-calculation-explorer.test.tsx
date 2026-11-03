import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { sajuReadingView } from "@/test-fixtures/saju-reading";
import { SajuCalculationExplorer } from "./saju-calculation-explorer";

function fixture() {
  const snapshot = sajuReadingView().input.calculationSnapshot;
  snapshot.pillars = { year: { ganZhi: "갑자" }, month: { ganZhi: "기축" }, day: { ganZhi: "임오" }, time: null };
  snapshot.fiveElements = { wood: 1, fire: 1, earth: 2, metal: 0, water: 2 };
  snapshot.relations = [{ type: "branch_clash", members: ["자", "오"] }];
  return snapshot;
}
const links = [
  { id: "saju-core", heading: "나를 움직이는 중심", evidenceKeys: ["dayMaster" as const] },
  { id: "saju-work", heading: "일하는 방식", evidenceKeys: ["elementBalance" as const] },
  { id: "saju-relationship", heading: "관계의 방식", evidenceKeys: ["interactions" as const] },
];

describe("SajuCalculationExplorer", () => {
  it("selects elements, highlights actual characters and exposes only matching reading links", () => {
    const { container } = render(<SajuCalculationExplorer snapshot={fixture()} links={links} />);
    expect(screen.getByRole("button", { name: "일간 · 나의 기준" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "토 · 흙 2개" }));
    expect(screen.getByRole("button", { name: "토 · 흙 2개" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(2);
    expect(screen.getAllByText("선택")).toHaveLength(2);
    const nav = screen.getByRole("navigation", { name: "선택한 계산을 사용한 리딩" });
    expect(within(nav).getByRole("link", { name: "일하는 방식 →" })).toHaveAttribute("href", "#saju-work");
    expect(within(nav).queryByText("나를 움직이는 중심 →")).not.toBeInTheDocument();
    expect(screen.getByText(/기운의 강약이나 성격 점수가 아닙니다/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "금 · 쇠 0개" }));
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
    expect(screen.getByText(/0개여도 결함/)).toBeInTheDocument();
  });

  it("does not highlight ambiguous, absent or unsupported relations", () => {
    const snapshot = fixture();
    snapshot.pillars.time = { ganZhi: "병자" };
    snapshot.relations.push({ type: "new_kind", members: ["갑", "기"] });
    const { container } = render(<SajuCalculationExplorer snapshot={snapshot} links={links} />);
    fireEvent.click(screen.getByRole("button", { name: /지지의 충.*자·오/ }));
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
    expect(screen.getByText(/위치를 특정할 수 없어/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /저장된 명식 관계/ }));
    expect(screen.getByText(/의미나 위치를 추가로 추정하지 않습니다/)).toBeInTheDocument();
  });

  it("shows confirmed relation positions and no extra pillar", () => {
    const { container } = render(<SajuCalculationExplorer snapshot={fixture()} links={links} />);
    fireEvent.click(screen.getByRole("button", { name: /지지의 충.*자·오/ }));
    expect(Array.from(container.querySelectorAll('[data-highlighted="true"]')).map((value) => value.textContent)).toEqual(["자선택", "오선택"]);
    expect(screen.queryByText("시주")).not.toBeInTheDocument();
  });

  it("keeps sparse and unknown data unexpanded across remounts", () => {
    const snapshot = fixture();
    delete snapshot.dayMaster;
    snapshot.pillars.day = null;
    snapshot.relations = [];
    snapshot.fiveElements = { wood: 1 };
    const { container, unmount } = render(<SajuCalculationExplorer snapshot={snapshot} links={[]} />);
    expect(screen.getByText(/일간이 확정되지 않아/)).toBeInTheDocument();
    expect(screen.getByText(/저장된 관계가 없습니다/)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /수 · 물/ })).not.toBeInTheDocument();
    unmount();
    render(<SajuCalculationExplorer snapshot={snapshot} links={[]} />);
    expect(screen.getByText(/일간이 확정되지 않아/)).toBeInTheDocument();
  });
});
