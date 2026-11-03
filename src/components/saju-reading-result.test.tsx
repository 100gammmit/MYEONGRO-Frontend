import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { sajuReadingView } from "@/test-fixtures/saju-reading";

import { SajuReadingResult } from "./saju-reading-result";
import { AI_GENERATED_NOTICE } from "./ai-generated-notice";
import { parseSajuReadingView } from "@/domain/saju/result";
import { sajuReadingRecord } from "@/test-fixtures/saju-reading";

describe("SajuReadingResult", () => {
  it("moves focus from calculation evidence to the corresponding reading", () => {
    render(<SajuReadingResult view={sajuReadingView()} />);
    const nav = screen.getByRole("navigation", { name: "선택한 계산을 사용한 리딩" });
    fireEvent.click(within(nav).getByRole("link", { name: "나를 움직이는 중심 →" }));
    expect(document.activeElement?.id).toBe("saju-core");
  });

  it.each([2, 3, 4])("uses the same explorer for legacy schema %i without exposing raw birth data", (schemaVersion) => {
    const record = sajuReadingRecord();
    const pillar = { ganZhi: "임신", stem: "임", branch: "신", fiveElements: "수금", stemTenGod: "정인", branchTenGods: [] };
    const snapshot = {
      ...record.input.calculationSnapshot,
      pillars: { year: pillar, month: pillar, day: pillar, time: null },
      timeCorrection: null,
      luckCycle: null,
      uncertainty: { precision: "unknown", candidateCount: 1440, rangeStart: "1992-08-17T00:00", rangeEnd: "1992-08-17T23:59", varyingFields: ["pillars.time"], candidateZoneOffsets: ["+09:00"] },
    };
    const { currentLuckCycle: _currentLuckCycle, ...legacySnapshot } = snapshot;
    void _currentLuckCycle;
    const view = parseSajuReadingView({
      ...record, schemaVersion,
      input: {
        targetYear: 2026, focusArea: "self",
        ...(schemaVersion !== 4 ? { question: "합성 질문" } : {}),
        birthProfile: {
          calendarType: "solar", birthDate: "1992-08-17", birthTimePrecision: "unknown", luckDirectionBasis: "unspecified",
          ...(schemaVersion === 2 ? { provinceCode: "36", cityCode: "36110" } : {}),
        },
        calculationSnapshot: legacySnapshot,
      },
    });
    expect(view).not.toBeNull();
    const { container, unmount } = render(<SajuReadingResult view={view!} />);
    expect(screen.getByRole("group", { name: "사주 탐색 항목" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "수 · 물 2개" }));
    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(3);
    expect(container).not.toHaveTextContent("1992-08-17");
    unmount();
  });
  it("renders a v5 record without raw birth details or precision metadata", () => {
    const { container } = render(<SajuReadingResult view={sajuReadingView()} />);

    expect(screen.getByText("AI SAJU · 사주 리딩")).toBeInTheDocument();
    expect(screen.getByLabelText("생성형 AI 사용 안내")).toHaveTextContent(AI_GENERATED_NOTICE);
    expect(screen.getByText("병오 · 2023-2032")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새 사주 리딩" })).toHaveAttribute("href", "/saju");
    expect(container).not.toHaveTextContent("출생 시각 정확도");
    expect(container).not.toHaveTextContent("후보 1,440개");
    expect(container).not.toHaveTextContent("1992-08-17");
  });

  it("keeps the mobile document order from calculation through limitations", () => {
    const { container } = render(<SajuReadingResult view={sajuReadingView()} />);
    const ids = Array.from(container.querySelectorAll("[id^='saju-']")).map(
      (element) => element.id,
    );

    expect(ids).toEqual([
      "saju-calculation", "saju-explorer-description", "saju-core", "saju-strengths", "saju-relationship",
      "saju-work", "saju-annual", "saju-question", "saju-summary", "saju-limitations",
    ]);
    expect(screen.getByRole("link", { name: "리딩 요약" })).toHaveAttribute("href", "#saju-summary");
    expect(container.querySelector("#saju-summary")).toHaveTextContent(sajuReadingView().result.summary);
    expect(screen.queryByText("지금 시도할 작은 행동")).not.toBeInTheDocument();
  });

  it("renders confirmed pillars, evidence, limitations, and current luck", () => {
    render(<SajuReadingResult view={sajuReadingView()} />);

    const pillarGrid = document.querySelector(".saju-pillar-grid");
    expect(pillarGrid).not.toBeNull();
    expect(within(pillarGrid as HTMLElement).getByText("연주")).toBeInTheDocument();
    expect(within(pillarGrid as HTMLElement).queryByText("시주")).not.toBeInTheDocument();
    expect(screen.getAllByText("이 해석에 사용한 계산 근거")).toHaveLength(6);
    expect(screen.getAllByText("시주 불확실").length).toBeGreaterThan(0);
  });

  it("renders sparse v5 calculation data without inventing missing values", () => {
    const view = sajuReadingView();
    const snapshot = view.input.calculationSnapshot;
    snapshot.pillars.month = null;
    snapshot.pillars.day = null;
    snapshot.pillars.time = null;
    delete snapshot.dayMaster;
    delete snapshot.annualFortune;
    snapshot.limitations = ["DAY_PILLAR_UNCERTAIN"];
    view.result.natalSections[0].evidenceKeys = ["pillars"];
    const { container } = render(<SajuReadingResult view={view} />);

    const facts = container.querySelector(".saju-calculation-facts") as HTMLElement;
    const pillarGrid = container.querySelector(".saju-pillar-grid") as HTMLElement;
    expect(within(facts).queryByText("일간")).not.toBeInTheDocument();
    expect(within(facts).getByText("후보에서 공통된 연간 흐름")).toBeInTheDocument();
    expect(within(pillarGrid).getByText("연주")).toBeInTheDocument();
    expect(within(pillarGrid).queryByText("월주")).not.toBeInTheDocument();
    expect(within(pillarGrid).queryByText("일주")).not.toBeInTheDocument();
    expect(container).not.toHaveTextContent("null");
  });

  it("keeps the safety notice when a v5 question is redirected", () => {
    const view = sajuReadingView();
    view.result.readingMode = "career_life_fortune";
    view.result.questionRedirected = true;

    render(<SajuReadingResult view={view} />);

    expect(screen.getByText("질문 대신 직업·생활운을 읽었어요")).toBeInTheDocument();
  });

  it("names relation codes in Korean", () => {
    const view = sajuReadingView();
    view.input.calculationSnapshot.relations = [
      { type: "stem_combination", members: ["무", "계"] },
      { type: "branch_clash", members: ["축", "미"] },
    ];
    const { container } = render(<SajuReadingResult view={view} />);

    expect(screen.getByText("합·충 관계 천간의 합(무·계), 지지의 충(축·미)"))
      .toBeInTheDocument();
    expect(container).not.toHaveTextContent("branch_clash");
  });
});
