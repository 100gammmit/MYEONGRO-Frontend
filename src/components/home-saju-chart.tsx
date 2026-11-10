import type { CSSProperties } from "react";

// A computed sample chart, drawn as decoration on the home page. It is the chart shared by the
// active saju preview cases (ai-preview cases/saju): year 임신, month 무신, day 갑진, hour unknown.
const SAMPLE_PILLARS = [
  { label: "시주", stem: null, branch: null },
  { label: "일주", stem: "갑", branch: "진" },
  { label: "월주", stem: "무", branch: "신" },
  { label: "연주", stem: "임", branch: "신" },
] as const;

function riseDelay(index: number): CSSProperties {
  return { "--rise-delay": `${0.25 + index * 0.1}s` } as CSSProperties;
}

// "hero": all four pillars with labels and one result line. "mini": the day and month pillars only,
// as the small picture in the how-it-works steps.
export function HomeSajuChart({ size }: { size: "hero" | "mini" }) {
  if (size === "mini") {
    return (
      <span aria-hidden="true" className="home-saju-mini">
        {SAMPLE_PILLARS.slice(1, 3).flatMap((pillar) => [
          <span key={`${pillar.label}-stem`}>{pillar.stem}</span>,
          <span key={`${pillar.label}-branch`}>{pillar.branch}</span>,
        ])}
      </span>
    );
  }

  return (
    <span aria-hidden="true" className="home-saju-chart">
      <span className="home-saju-pillars">
        {SAMPLE_PILLARS.map((pillar, index) => (
          <span className="home-saju-pillar home-rise" key={pillar.label} style={riseDelay(index)}>
            <span className="home-saju-label">{pillar.label}</span>
            {pillar.stem ? (
              <span className={pillar.label === "일주" ? "home-saju-cell day" : "home-saju-cell"}>
                <span>{pillar.stem}</span>
                <span>{pillar.branch}</span>
              </span>
            ) : (
              <span className="home-saju-cell unknown">
                <span>시각</span>
                <span>모름</span>
              </span>
            )}
          </span>
        ))}
      </span>
      <span className="home-saju-result home-rise" style={{ "--rise-delay": ".7s" } as CSSProperties}>
        내 생각을 말과 행동으로 옮기는 해
      </span>
    </span>
  );
}
