import Link from "next/link";
import type { ReactNode } from "react";

import type {
  SajuCalculationSnapshot,
  SajuEvidenceKey,
  SajuReadingView,
} from "@/domain/saju/result";
import { readingModeNotice } from "@/domain/reading/reading-mode";

import { SajuFollowUpAction } from "./saju-follow-up-action";

const FOCUS_LABELS = {
  self: "나의 성향",
  career: "일·진로",
  relationship: "관계",
  life_money: "재정·생활",
} as const;

const PILLAR_LABELS = {
  year: "연주",
  month: "월주",
  day: "일주",
  time: "시주",
} as const;

const ELEMENT_LABELS: Record<string, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const LIMITATION_COPY: Record<string, { title: string; body: string }> = {
  BIRTH_TIME_UNKNOWN: {
    title: "출생 시각 미상",
    body: "시주와 시간에 따라 달라질 수 있는 해석은 확정하지 않았어요.",
  },
  APPROXIMATE_BIRTH_TIME: {
    title: "대략적인 출생 시각",
    body: "입력 시각의 앞뒤 60분 후보에서 공통된 계산만 사용했어요.",
  },
  YEAR_PILLAR_UNCERTAIN: { title: "연주 경계 가능성", body: "후보 시각에 따라 연주가 달라져 확정하지 않았어요." },
  MONTH_PILLAR_UNCERTAIN: { title: "월주 경계 가능성", body: "후보 시각에 따라 월주가 달라져 확정하지 않았어요." },
  DAY_PILLAR_UNCERTAIN: { title: "일주 경계 가능성", body: "후보 시각에 따라 일주가 달라져 확정하지 않았어요." },
  TIME_PILLAR_UNCERTAIN: { title: "시주 불확실", body: "후보 시각에 따라 시주가 달라져 결과에서 제외했어요." },
  LUCK_CYCLE_UNCERTAIN: { title: "대운 불확실", body: "후보 시각에 따라 대운이 달라져 하나로 확정하지 않았어요." },
  LUCK_DIRECTION_UNSPECIFIED: { title: "대운 계산 기준 미지정", body: "대운은 제외하고 원국과 해당 연도 흐름만 해석했어요." },
  DST_GAP_SKIPPED: { title: "과거 표준시 공백", body: "당시 존재하지 않았던 민간시각 후보는 계산에서 제외했어요." },
  DST_OVERLAP_AMBIGUOUS: { title: "과거 표준시 중복", body: "두 번 존재했던 민간시각 후보를 모두 비교해 공통된 계산만 사용했어요." },
};

export function SajuReadingResult({
  view,
  backHref = "/",
  backLabel = "홈으로",
  footer,
}: {
  view: SajuReadingView;
  backHref?: string;
  backLabel?: string;
  footer?: ReactNode;
}) {
  const snapshot = view.input.calculationSnapshot;
  const confirmedPillars = Object.entries(snapshot.pillars).filter((entry) => entry[1] !== null);
  const currentLuck = snapshot.luckCycle?.periods.find(
    (period) => period.startYear <= snapshot.targetYear && snapshot.targetYear <= period.endYear,
  );
  const modeNotice = readingModeNotice(view.result.readingMode);

  return (
    <article className="saju-result page-width">
      <Link className="back-link" href={backHref}>← {backLabel}</Link>
      <header className="saju-result-hero">
        <p className="eyebrow">AI SAJU · {FOCUS_LABELS[view.input.focusArea]}</p>
        <h1>{view.result.title}</h1>
        <p>{view.result.summary}</p>
        <blockquote>{view.input.question}</blockquote>
      </header>

      {modeNotice ? <aside className="reading-mode-notice">{modeNotice}</aside> : null}

      {snapshot.limitations.length > 0 ? (
        <aside className="saju-limitation-summary">
          <div>
            <strong>확정할 수 있는 범위만 읽었어요</strong>
            <span>{snapshot.limitations.map((code) => LIMITATION_COPY[code]?.title ?? "추가 계산 제한사항").join(" · ")}</span>
          </div>
          <a href="#saju-limitations">자세히 보기</a>
        </aside>
      ) : null}

      <nav aria-label="사주 리딩 목차" className="saju-result-toc">
        <a href="#saju-calculation">명식과 계산 기준</a>
        {view.result.natalSections.map((section) => <a href={`#saju-${section.id}`} key={section.id}>{section.heading}</a>)}
        <a href="#saju-annual">{view.result.annualReading.heading}</a>
        <a href="#saju-question">질문 리딩</a>
        <a href="#saju-guidance">지금 시도할 행동</a>
        <a href="#saju-limitations">계산 제한사항</a>
      </nav>

      <section className="saju-calculation" id="saju-calculation">
        <div className="saju-section-heading">
          <p className="eyebrow">CONFIRMED CALCULATION</p>
          <h2>확정된 명식과 계산 기준</h2>
          <p>가능한 출생 시각 후보에서 공통으로 확인된 계산만 표시합니다.</p>
        </div>
        <div className="saju-pillar-grid">
          {confirmedPillars.map(([key, pillar]) => pillar ? (
            <article key={key}>
              <span>{PILLAR_LABELS[key as keyof typeof PILLAR_LABELS]}</span>
              <strong>{pillar.ganZhi}</strong>
              {pillar.stemTenGod ? <small>{pillar.stemTenGod}</small> : null}
            </article>
          ) : null)}
        </div>
        <dl className="saju-calculation-facts">
          {snapshot.dayMaster ? <div><dt>일간</dt><dd>{snapshot.dayMaster}</dd></div> : null}
          <div><dt>오행 분포</dt><dd>{elementBalanceText(snapshot)}</dd></div>
          <div><dt>{snapshot.targetYear}년 세운</dt><dd>{annualFortuneText(snapshot)}</dd></div>
          {currentLuck ? <div><dt>현재 대운</dt><dd>{currentLuck.ganZhi} · {currentLuck.startYear}-{currentLuck.endYear}</dd></div> : null}
        </dl>
        <details className="saju-calculation-meta">
          <summary>계산 버전과 시간 기준 보기</summary>
          <dl>
            <div><dt>계산 규칙</dt><dd>{snapshot.calculationVersion}</dd></div>
            <div><dt>계산 엔진</dt><dd>{snapshot.engine} {snapshot.engineVersion}</dd></div>
            <div><dt>출생 시각 정확도</dt><dd>{uncertaintyText(snapshot)}</dd></div>
          </dl>
        </details>
      </section>

      <div className="saju-reading-sections">
        {view.result.natalSections.map((section) => (
          <section id={`saju-${section.id}`} key={section.id}>
            <h2>{section.heading}</h2>
            <p>{section.body}</p>
            <EvidenceDetails evidenceKeys={section.evidenceKeys} snapshot={snapshot} />
          </section>
        ))}
        <section id="saju-annual">
          <h2>{view.result.annualReading.heading}</h2>
          <p>{view.result.annualReading.body}</p>
          <EvidenceDetails evidenceKeys={view.result.annualReading.evidenceKeys} snapshot={snapshot} />
        </section>
        <section className="saju-question-reading" id="saju-question">
          <p className="eyebrow">YOUR QUESTION</p>
          <h2>{view.result.questionReading.heading}</h2>
          <p>{view.result.questionReading.body}</p>
          <EvidenceDetails evidenceKeys={view.result.questionReading.evidenceKeys} snapshot={snapshot} />
        </section>
      </div>

      <section className="reading-guidance saju-guidance" id="saju-guidance">
        <h2>지금 시도할 작은 행동</h2>
        <ol>{view.result.guidance.map((item) => <li key={item}>{item}</li>)}</ol>
      </section>

      <section className="saju-limitations" id="saju-limitations">
        <h2>계산 제한사항</h2>
        {snapshot.limitations.length > 0 ? (
          <ul>
            {snapshot.limitations.map((code) => {
              const copy = LIMITATION_COPY[code] ?? {
                title: "추가 계산 제한사항",
                body: "일부 계산은 확정할 수 있는 범위만 결과에 반영했어요.",
              };
              return <li key={code}><strong>{copy.title}</strong><span>{copy.body}</span></li>;
            })}
          </ul>
        ) : <p>현재 기록에는 별도의 계산 제한사항이 없습니다.</p>}
      </section>

      <p className="reading-disclaimer">{view.result.disclaimer}</p>
      <div className="result-actions saju-result-actions">
        <SajuFollowUpAction birthProfile={view.input.birthProfile} />
        <Link className="secondary-button" href="/records">내 기록 보기</Link>
      </div>
      {footer}
    </article>
  );
}

function EvidenceDetails({
  evidenceKeys,
  snapshot,
}: {
  evidenceKeys: SajuEvidenceKey[];
  snapshot: SajuCalculationSnapshot;
}) {
  return (
    <details className="saju-evidence">
      <summary>이 해석에 사용한 계산 근거</summary>
      <ul>{evidenceKeys.map((key) => <li key={key}>{evidenceText(key, snapshot)}</li>)}</ul>
    </details>
  );
}

function evidenceText(key: SajuEvidenceKey, snapshot: SajuCalculationSnapshot): string {
  const confirmed = Object.values(snapshot.pillars).filter((pillar) => pillar !== null);
  switch (key) {
    case "pillars": return `확정된 기둥 ${confirmed.map((pillar) => pillar?.ganZhi).join(" · ")}`;
    case "dayMaster": return snapshot.dayMaster ? `일간 ${snapshot.dayMaster}` : "후보에서 공통된 일간";
    case "elementBalance": return `오행 분포 ${elementBalanceText(snapshot)}`;
    case "tenGods": return "확정된 기둥에 연결된 십성 관계";
    case "interactions": return snapshot.relations.length > 0
      ? `지지 관계 ${snapshot.relations.map((relation) => `${relation.type}(${relation.members.join("·")})`).join(", ")}`
      : "후보에서 공통된 지지 관계";
    case "currentLuckCycle": return "현재 연도에 해당하는 대운 흐름";
    case "annualFlow": return `${snapshot.targetYear}년 세운 ${annualFortuneText(snapshot)}`;
    case "limitations": return "계산에서 확정하지 않은 항목과 적용 한계";
    case "uncertainty": return `출생 시각 후보 ${snapshot.uncertainty.candidateCount.toLocaleString("ko-KR")}개 비교`;
  }
}

function elementBalanceText(snapshot: SajuCalculationSnapshot): string {
  return Object.entries(snapshot.fiveElements)
    .map(([element, count]) => `${ELEMENT_LABELS[element] ?? element} ${count}`)
    .join(" · ");
}

function annualFortuneText(snapshot: SajuCalculationSnapshot): string {
  return snapshot.annualFortune
    ? `${snapshot.annualFortune.ganZhi} · ${snapshot.annualFortune.stemTenGod}`
    : "후보에서 공통된 연간 흐름";
}

function uncertaintyText(snapshot: SajuCalculationSnapshot): string {
  const precision = snapshot.uncertainty.precision === "exact"
    ? "정확한 시각"
    : snapshot.uncertainty.precision === "approximate"
      ? "대략적인 시각"
      : "시간 미상";
  return `${precision} · 후보 ${snapshot.uncertainty.candidateCount.toLocaleString("ko-KR")}개`;
}
