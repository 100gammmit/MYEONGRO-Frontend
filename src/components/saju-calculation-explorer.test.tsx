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

// The tour of terms is folded away under the chart; most checks open it first.
function renderOpen(ui: React.ReactElement) {
  const view = render(ui);
  fireEvent.click(screen.getByRole("button", { name: "내 사주 탐색 열기" }));
  return view;
}

describe("SajuCalculationExplorer", () => {
  it("shows the chart in traditional order with the tour folded away until asked", () => {
    const snapshot = fixture();
    snapshot.pillars.time = { ganZhi: "병자" };
    const { container } = render(<SajuCalculationExplorer snapshot={snapshot} links={links} />);

    const labels = [...container.querySelectorAll(".saju-pillar-grid article > span")].map((node) => node.textContent);
    expect(labels).toEqual(["시주", "일주", "월주", "연주"]);
    const toggle = screen.getByRole("button", { name: "내 사주 탐색 열기" });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("group", { name: "사주 탐색 항목" })).not.toBeInTheDocument();
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);

    fireEvent.click(toggle);
    expect(screen.getByRole("button", { name: "내 사주 탐색 닫기" })).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("group", { name: "사주 탐색 항목" })).toBeInTheDocument();
  });

  it("selects elements, highlights actual characters and exposes only matching reading links", () => {
    const { container } = renderOpen(<SajuCalculationExplorer snapshot={fixture()} links={links} />);
    expect(screen.getByRole("button", { name: "일간 · 나의 기준" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(1);
    fireEvent.click(screen.getByRole("button", { name: "토 · 흙 2개" }));
    expect(screen.getByRole("button", { name: "토 · 흙 2개" })).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(2);
    expect(screen.getAllByText("선택")).toHaveLength(2);
    const nav = screen.getByRole("navigation", { name: "선택한 계산을 사용한 리딩" });
    expect(within(nav).getByRole("link", { name: "일하는 방식" })).toHaveAttribute("href", "#saju-work");
    expect(within(nav).queryByText("나를 움직이는 중심")).not.toBeInTheDocument();
    expect(screen.getByText("오행의 개수와 상생·상극만으로 좋고 나쁨이나 강약을 판단하지 않습니다.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "금 · 쇠 0개" }));
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
    expect(screen.getByText(/이 명식에는 0개가 있습니다/)).toBeInTheDocument();
  });

  it("does not highlight ambiguous, absent or unsupported relations", () => {
    const snapshot = fixture();
    snapshot.pillars.time = { ganZhi: "병자" };
    snapshot.relations.push({ type: "new_kind", members: ["갑", "기"] });
    const { container } = renderOpen(<SajuCalculationExplorer snapshot={snapshot} links={links} />);
    fireEvent.click(screen.getByRole("button", { name: /지지의 충.*자·오/ }));
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
    expect(screen.getByText(/같은 글자가 여러 자리에 있어/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /명식의 관계 \(/ }));
    expect(screen.getByText(/이 관계에 대한 설명은 아직 준비되지 않았습니다/)).toBeInTheDocument();
  });

  it("shows confirmed relation positions and no extra pillar", () => {
    const { container } = renderOpen(<SajuCalculationExplorer snapshot={fixture()} links={links} />);
    fireEvent.click(screen.getByRole("button", { name: /지지의 충.*자·오/ }));
    // Drawn hour, day, month, year: the day pillar comes before the year pillar.
    expect(Array.from(container.querySelectorAll('[data-highlighted="true"]')).map((value) => value.textContent)).toEqual(["오선택", "자선택"]);
    expect(screen.queryByText("시주")).not.toBeInTheDocument();
  });

  it("keeps sparse and unknown data unexpanded across remounts", () => {
    const snapshot = fixture();
    delete snapshot.dayMaster;
    snapshot.pillars.day = null;
    snapshot.relations = [];
    snapshot.fiveElements = { wood: 1 };
    const { container, unmount } = renderOpen(<SajuCalculationExplorer snapshot={snapshot} links={[]} />);
    expect(screen.getByText(/일간이 확정되지 않아/)).toBeInTheDocument();
    expect(screen.getByText(/표시된 글자 사이에 해당하는 관계가 없습니다/)).toBeInTheDocument();
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
    expect(screen.queryByRole("button", { name: /수 · 물/ })).not.toBeInTheDocument();
    unmount();
    renderOpen(<SajuCalculationExplorer snapshot={snapshot} links={[]} />);
    expect(screen.getByText(/일간이 확정되지 않아/)).toBeInTheDocument();
  });

  it.each([
    ["목 · 나무 1개", "봄", "동쪽", "목은 화를 돕고, 수에게서 도움을 받습니다.", "목은 토를 조절하고, 금에게서 조절을 받습니다."],
    ["화 · 불 1개", "여름", "남쪽", "화는 토를 돕고, 목에게서 도움을 받습니다.", "화는 금을 조절하고, 수에게서 조절을 받습니다."],
    ["토 · 흙 2개", "계절이 바뀌는 사이", "가운데", "토는 금을 돕고, 화에게서 도움을 받습니다.", "토는 수를 조절하고, 목에게서 조절을 받습니다."],
    ["금 · 쇠 0개", "가을", "서쪽", "금은 수를 돕고, 토에게서 도움을 받습니다.", "금은 목을 조절하고, 화에게서 조절을 받습니다."],
    ["수 · 물 2개", "겨울", "북쪽", "수는 목을 돕고, 금에게서 도움을 받습니다.", "수는 화를 조절하고, 토에게서 조절을 받습니다."],
  ])("explains %s as traditional symbols and flows, separate from counts", (button, season, direction, generates, controls) => {
    const { container } = renderOpen(<SajuCalculationExplorer snapshot={fixture()} links={[]} />);
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(screen.getByText(season)).toBeInTheDocument();
    expect(screen.getByText(direction)).toBeInTheDocument();
    const flows = screen.getByRole("region", { name: "오행 사이의 흐름" });
    expect(within(flows).getByText(generates)).toBeInTheDocument();
    expect(within(flows).getByText(controls)).toBeInTheDocument();
    expect(flows).not.toHaveTextContent(/\d+개|이 명식/);
    expect(screen.getAllByText(/좋고 나쁨|강약/)).toHaveLength(1);
    expect(within(flows).getByText("오행의 개수와 상생·상극만으로 좋고 나쁨이나 강약을 판단하지 않습니다.")).toBeInTheDocument();
    expect(container).not.toHaveTextContent(/저장된|snapshot|확정된 기둥|결함|보완이 필요/);
    expect(container).toHaveTextContent("개인별 AI 해석을 추가로 생성하지 않습니다.");
  });

  it.each([["인", "해", "寅", "亥"], ["사", "신", "巳", "申"]])("explains simultaneous combination/break for %s·%s from either selection", (first, second, hanjaFirst, hanjaSecond) => {
    const snapshot = fixture();
    snapshot.relations = [{ type: "branch_combination", members: [first, second] }, { type: "branch_break", members: [hanjaSecond, hanjaFirst] }];
    const { container } = renderOpen(<SajuCalculationExplorer snapshot={snapshot} links={links} />);
    for (const relation of ["지지의 합", "지지의 파"]) {
      fireEvent.click(screen.getByRole("button", { name: new RegExp(relation) }));
      const explanation = screen.getByText(/전통 규칙에서/);
      expect(explanation).toHaveTextContent(/지지의 합/);
      expect(explanation).toHaveTextContent(/지지의 파/);
      expect(explanation).toHaveTextContent(relation === "지지의 합"
        ? "지지의 합과 지지의 파에 함께 속하는 짝입니다."
        : "지지의 파와 지지의 합에 함께 속하는 짝입니다.");
      expect(explanation).toHaveTextContent("서로 묶이면서도 틈이 생길 수 있는 관계");
      expect(explanation).not.toHaveTextContent(/寅|亥|巳|申/);
      expect(screen.getAllByText("관계는 앞으로 일어날 사건을 예고하지 않습니다.")).toHaveLength(1);
      expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0);
      expect(container).not.toHaveTextContent("같은 글자가 여러 자리에 있어");
      expect(container).not.toHaveTextContent(/저장된|snapshot/);
    }
  });

  it("does not add paired copy for a standalone relation", () => {
    renderOpen(<SajuCalculationExplorer snapshot={fixture()} links={links} />);
    fireEvent.click(screen.getByRole("button", { name: /지지의 충/ }));
    expect(screen.queryByText(/전통 규칙에서/)).not.toBeInTheDocument();
    expect(screen.getByText(/변화와 움직임이 생기기 쉬운 지점/)).toBeInTheDocument();
  });

  it.each(["year", "month", "day", "time"] as const)("shows the partial-pillar notice only when %s is missing", (missing) => {
    const snapshot = fixture();
    snapshot.pillars.time = { ganZhi: "병술" };
    const { rerender } = renderOpen(<SajuCalculationExplorer snapshot={snapshot} links={[]} />);
    fireEvent.click(screen.getByRole("button", { name: "목 · 나무 1개" }));
    expect(screen.queryByText(/출생 시각이 확정되지 않은 기둥/)).not.toBeInTheDocument();
    snapshot.pillars[missing] = null;
    rerender(<SajuCalculationExplorer snapshot={snapshot} links={[]} />);
    expect(screen.getAllByText(/출생 시각이 확정되지 않은 기둥/)).toHaveLength(1);
  });
});
