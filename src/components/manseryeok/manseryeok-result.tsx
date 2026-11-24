"use client";

import Link from "next/link";
import { useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";

import { birthPlaceName, birthTimeSummary, formatBirthDate, isBirthTimeKnown, luckBasisSummary, type SajuBirthValues } from "@/domain/saju/birth-input";
import type { SajuBirthPlacesResponse } from "@/domain/saju/contracts";
import { DICTIONARY_PATH, branchPath, branchSlugOf, elementPath, stemPath, stemSlugOf, tenGodPath, tenGodSlugOf } from "@/domain/saju-dictionary/slugs";
import { getSajuCurrentYear } from "@/domain/saju/monthly-calendar";
import {
  CHART_COLUMNS,
  ELEMENT_NAMES,
  ELEMENT_ORDER,
  POSITION_LABELS,
  POSITION_SHORT,
  branchTenGod,
  correctedTime,
  currentLuckIndex,
  elementCellCount,
  ganZhiGlyphs,
  glyph,
  relationGroups,
  signedMinutes,
  termStart,
  type Glyph,
} from "@/domain/manseryeok/display";
import type { ManseryeokChart, ManseryeokPosition } from "@/domain/manseryeok/schema";

import styles from "./manseryeok.module.css";

export type MonthlyYearChoice = "current" | "next";

export interface ManseryeokResultProps {
  readonly chart: ManseryeokChart;
  /** The chart whose monthly calendar is shown; null while next year is still loading. */
  readonly monthlyChart: ManseryeokChart | null;
  readonly monthlyState: "idle" | "loading" | "failed" | "limited";
  readonly yearChoice: MonthlyYearChoice;
  readonly onChooseYear: (choice: MonthlyYearChoice) => void;
  readonly birth: SajuBirthValues;
  readonly catalog: SajuBirthPlacesResponse | null;
  readonly onEdit: (focusField?: "luck") => void;
  readonly onStartOver: () => void;
  readonly onAskAi?: () => void;
}

const SECTIONS = [
  ["chart", "명식표"],
  ["elements", "오행과 관계"],
  ["luck", "대운"],
  ["annual", "세운 10년"],
  ["monthly", "월운"],
  ["basis", "계산 기준"],
] as const;

export function ManseryeokResult({
  chart, monthlyChart, monthlyState, yearChoice, onChooseYear, birth, catalog, onEdit, onStartOver, onAskAi,
}: ManseryeokResultProps) {
  const [relationType, setRelationType] = useState<string | null>(null);
  const relations = relationGroups(chart);
  const selected = relations.present.find((group) => group.type === relationType) ?? null;
  const highlighted = new Set(selected?.items.flatMap((relation) => relation.members.map((member) => `${member.position}-${selected.type.startsWith("stem_") ? "stem" : "branch"}`)) ?? []);
  const time = correctedTime(chart);
  const today = getSajuCurrentYear();
  const annualStripRef = useRef<HTMLOListElement>(null);
  useShowCurrent(annualStripRef, chart.annualFlows.findIndex((flow) => flow.year === today));
  const dayMaster = chart.chart.dayMaster;
  // A place kept from an earlier entry is not used when the time is unknown, so it is not shown.
  const place = isBirthTimeKnown(birth.birthTimePrecision) ? birthPlaceName(catalog, birth) : "";

  return (
    <article className={`page-width ${styles.result}`}>
      <button className={styles.back} onClick={() => onEdit()} type="button"><span aria-hidden="true">←</span> 입력 바꾸기</button>
      <h1 className={styles.title}>만세력 결과</h1>

      <section className={styles.who} aria-label="입력한 정보와 보정한 시각">
        <dl>
          <div><dt>양력 생년월일</dt><dd>{formatBirthDate(birth.birthDate)}</dd></div>
          <div><dt>출생 시각</dt><dd>{birthTimeSummary(birth)}</dd></div>
          {place ? <div><dt>출생 지역</dt><dd>{place}</dd></div> : null}
          <div><dt>성별</dt><dd>{luckBasisSummary(birth.luckDirectionBasis)}</dd></div>
        </dl>
        <CorrectedTimeBox time={time} />
      </section>
      <p className={styles.keep}>결과는 저장하지 않아요. 새로고침하거나 페이지를 떠나면 다시 계산해야 해요.</p>

      <nav aria-label="결과 목차">
        <ol className={styles.toc}>
          {SECTIONS.map(([id, label], index) => <li key={id}><a href={`#manseryeok-${id}`}><b>{index + 1}</b>{label}</a></li>)}
        </ol>
      </nav>

      <Section id="chart" index={1} title="명식표" note={dayMaster ? `십성·12운성은 일간 ${dayMaster.hanja} 기준` : undefined}>
        <ChartTable chart={chart} highlighted={highlighted} />
        <ul className={styles.elementKey} aria-label="오행 색">
          {ELEMENT_ORDER.map((element) => <li key={element}><i className={styles[element]} aria-hidden="true" />{ELEMENT_NAMES[element]}</li>)}
          <li className={styles.plain}>+ 양 · − 음</li>
        </ul>
        <details className={styles.glossary}>
          <summary>처음이라면: 용어 풀이</summary>
          <dl>
            <dt>일간</dt><dd>태어난 날의 천간이에요. 명식표의 다른 글자는 모두 일간과의 관계로 읽어요.</dd>
            <dt>십성</dt><dd>일간과 다른 글자 사이의 관계를 열 가지 이름으로 나눈 것이에요. 좋고 나쁨이 아니라 관계의 종류예요.</dd>
            <dt>지장간</dt><dd>지지 안에 함께 들어 있는 천간이에요. 겉으로 보이지 않는 성분을 살필 때 써요.</dd>
            <dt>12운성</dt><dd>일간의 기운이 각 지지에서 어느 단계에 있는지를 열두 단계로 나타낸 것이에요.</dd>
            <dt>공망</dt><dd>일주나 연주를 기준으로 비어 있다고 보는 두 지지예요.</dd>
          </dl>
          <p className={styles.glossaryMore}>
            <span>천간·지지 글자와 십성 이름, 오행을 누르면 뜻을 볼 수 있어요.</span>
            <Link href={DICTIONARY_PATH} rel="noopener" target="_blank">사주 개념 사전 전체 보기 <span aria-hidden="true">→</span></Link>
          </p>
        </details>
      </Section>

      <Section id="elements" index={2} title="오행과 관계" note={relations.present.length ? "관계를 누르면 명식표에 표시돼요" : undefined}>
        {relations.present.length ? (
          <ul className={styles.relationChips} aria-label="글자 사이 관계">
            {relations.present.map((group) => (
              <li key={group.type}>
                <button aria-pressed={relationType === group.type} className={styles.chip} onClick={() => setRelationType(relationType === group.type ? null : group.type)} type="button">
                  {group.label} <b>{group.items.length}</b>
                </button>
              </li>
            ))}
          </ul>
        ) : <p className={styles.muted}>이 명식에는 글자 사이의 합·충 같은 관계가 없어요.</p>}
        {selected ? (
          <div className={styles.relationSay} role="status">
            <strong>{selected.items.map((relation) => relation.members.map((member) => `${POSITION_SHORT[member.position]}${selected.type.startsWith("stem_") ? "간" : "지"} ${member.symbol.hanja}`).join(" · ")).join(", ")} — {selected.label}</strong>
            <p>{selected.description} 명식표에 테두리로 표시했어요.</p>
          </div>
        ) : null}
        {relations.present.length && relations.absent.length ? <p className={styles.muted}>이 명식에 없는 관계: {relations.absent.join(" · ")}</p> : null}
        {chart.relations.status === "limited" ? <p className={styles.muted}>태어난 시각 후보에 따라 갈리는 관계는 빼고, 확정된 관계만 보여 드려요.</p> : null}

        <div className={styles.cards}>
          <div className={styles.card}>
            <h3>오행 분포 <span>· 글자 수</span></h3>
            <ElementCells chart={chart} />
            <p className={styles.muted}>글자 수를 센 것이고, 많고 적음을 강약 점수로 보지 않아요.</p>
          </div>
          <div className={styles.card}>
            <h3>공망</h3>
            <VoidLine chart={chart} />
          </div>
        </div>
      </Section>

      <Section id="luck" index={3} title="대운" note="10년마다 바뀌는 큰 흐름">
        <LuckSection chart={chart} birth={birth} today={today} onEdit={onEdit} />
      </Section>

      <Section id="annual" index={4} title="세운 10년" note="입춘부터 다음 입춘 전까지">
        <ol className={styles.strip} aria-label="세운" ref={annualStripRef} tabIndex={0}>
          {chart.annualFlows.map((flow) => {
            const [stem, branch] = [glyph(flow.ganZhi.hanja[0] ?? "", "stem"), glyph(flow.ganZhi.hanja[1] ?? "", "branch")];
            return (
              <li className={flow.year === today ? styles.now : undefined} key={flow.year}>
                <span className={styles.age}>{flow.year}{flow.year === today ? " · 지금" : ""}</span>
                {flow.stemTenGod ? <span className={styles.tenGod}>{flow.stemTenGod}</span> : null}
                <GlyphChar glyph={stem} /><GlyphChar glyph={branch} />
              </li>
            );
          })}
        </ol>
      </Section>

      <Section id="monthly" index={5} title="월운">
        <div className={styles.yearToggle} role="group" aria-label="월운 연도">
          {(["current", "next"] as const).map((choice) => (
            <button aria-pressed={yearChoice === choice} key={choice} onClick={() => onChooseYear(choice)} type="button">
              {chart.referenceYear + (choice === "next" ? 1 : 0)}년 · {choice === "next" ? "내년" : "올해"}
            </button>
          ))}
        </div>
        <p className={styles.muted}>절입 시각에 월주가 바뀌어요. 시각은 한국 시각이에요.</p>
        <MonthlyCards chart={monthlyChart} state={monthlyState} today={today} />
      </Section>

      <Section id="basis" index={6} title="계산 기준">
        <BasisList chart={chart} time={time} place={place} />
        <h3 className={styles.subhead}>명로의 계산 방식</h3>
        <ul className={styles.method}>
          <li>연주는 입춘, 월주는 절입 시각을 기준으로 바꿔요.</li>
          <li>태어난 곳의 경도와 균시차로 태양 기준 시각을 구한 뒤 시주를 정해요. 한국의 과거 서머타임과 표준시 변경도 반영해요.</li>
        </ul>
      </Section>

      <section className={styles.ai} aria-labelledby="manseryeok-ai">
        <h2 id="manseryeok-ai">이 명식으로 풀이를 받아 보고 싶다면</h2>
        <p>지금 입력한 정보 그대로 AI 사주 리딩으로 넘어가요. 같은 계산 기준을 써서 여기서 본 명식으로 풀이해요.</p>
        <div className={styles.aiActions}>
          <button className="primary-button" onClick={onAskAi} type="button">이 명식으로 AI 풀이 받기</button>
          <button className="secondary-button" onClick={onStartOver} type="button">다른 생년월일 계산하기</button>
        </div>
        <p className={styles.muted}>로그인과 크레딧이 필요해요. 입력한 정보는 이 탭에 잠시 보관했다가 사주 입력 칸에 채운 뒤 바로 지워요.</p>
      </section>
      <p className={styles.disclaimer}>만세력은 전통 역법에 따른 계산 결과이며, 해석이나 전문적인 조언을 대신하지 않아요.</p>
    </article>
  );
}

function Section({ id, index, title, note, children }: { id: string; index: number; title: string; note?: string; children: ReactNode }) {
  return (
    <section className={styles.section} id={`manseryeok-${id}`} aria-labelledby={`manseryeok-${id}-title`}>
      <div className={styles.sectionHead}>
        <h2 id={`manseryeok-${id}-title`}><b>{index}</b>{title}</h2>
        {note ? <span>{note}</span> : null}
      </div>
      {children}
    </section>
  );
}

/**
 * On a phone the luck and year strips scroll sideways; start each with its current cell in view.
 * Only the strip scrolls, never the page, and a strip that fits does nothing.
 */
function useShowCurrent(ref: RefObject<HTMLOListElement | null>, index: number) {
  useLayoutEffect(() => {
    const strip = ref.current;
    const cell = index >= 0 ? strip?.children[index] : undefined;
    if (!strip || !(cell instanceof HTMLElement) || strip.scrollWidth <= strip.clientWidth) return;
    strip.scrollLeft = Math.max(0, cell.offsetLeft - strip.offsetLeft - (strip.clientWidth - cell.offsetWidth) / 2);
  }, [ref, index]);
}

function GlyphChar({ glyph: value, large = false }: { glyph: Glyph; large?: boolean }) {
  return <span className={`${large ? styles.hanLarge : styles.han} ${value.element ? styles[value.element] : ""}`} title={value.korean}>{value.hanja}</span>;
}

/** A chart glyph; with href it opens the glyph's dictionary page in a new tab, like the ten god links. */
function GlyphCell({ glyph: value, href }: { glyph: Glyph; href?: string | null }) {
  const body = (
    <>
      <GlyphChar glyph={value} large />
      <span className={styles.glyphKey}>
        <span>{value.korean}</span>
        {value.element ? <small className={styles[value.element]}>{value.sign}{ELEMENT_NAMES[value.element]}</small> : null}
      </span>
    </>
  );
  if (!href) return <span className={styles.glyph}>{body}</span>;
  return (
    <Link aria-label={`${value.korean}(${value.hanja}) 뜻 보기`} className={`${styles.glyph} ${styles.glyphLink}`} href={href} rel="noopener" target="_blank">
      {body}
    </Link>
  );
}

function stemHref(hanja: string): string | null {
  const slug = stemSlugOf(hanja);
  return slug ? stemPath(slug) : null;
}

function branchHref(hanja: string): string | null {
  const slug = branchSlugOf(hanja);
  return slug ? branchPath(slug) : null;
}

function ChartTable({ chart, highlighted }: { chart: ManseryeokChart; highlighted: Set<string> }) {
  const pillars = chart.chart.pillars;
  const cell = (position: ManseryeokPosition, extra = "") => `${position === "day" ? styles.me : ""} ${extra}`.trim();
  const blank = (position: ManseryeokPosition) => pillars[position] === null;
  const blankText = chart.uncertainty.precision === "unknown" ? "시각을 몰라 비워 뒀어요" : "후보에 따라 갈려 비워 뒀어요";
  return (
    <div className={styles.chartWrap}>
      <table className={styles.chart}>
        <colgroup><col className={styles.rowHeadCol} />{CHART_COLUMNS.map((position) => <col key={position} />)}</colgroup>
        <thead>
          <tr>
            <td />
            {CHART_COLUMNS.map((position) => <th className={position === "day" ? styles.meHead : undefined} key={position} scope="col">{POSITION_LABELS[position]}{position === "day" ? " · 나" : ""}</th>)}
          </tr>
        </thead>
        <tbody>
          <tr>
            <th scope="row">십성</th>
            {CHART_COLUMNS.map((position) => blank(position)
              ? <td className={styles.blank} key={position} rowSpan={6}><span>{blankText}</span></td>
              : <td className={cell(position)} key={position}>{position === "day" ? <span className={styles.tenGod}>일간</span> : <TenGodText name={pillars[position]?.stemTenGod} />}</td>)}
          </tr>
          <tr>
            <th scope="row">천간</th>
            {CHART_COLUMNS.filter((position) => !blank(position)).map((position) => (
              <td className={cell(position, highlighted.has(`${position}-stem`) ? styles.hit : "")} key={position}><GlyphCell glyph={glyph(pillars[position]!.stem.hanja, "stem")} href={stemHref(pillars[position]!.stem.hanja)} /></td>
            ))}
          </tr>
          <tr>
            <th scope="row">지지</th>
            {CHART_COLUMNS.filter((position) => !blank(position)).map((position) => (
              <td className={cell(position, highlighted.has(`${position}-branch`) ? styles.hit : "")} key={position}><GlyphCell glyph={glyph(pillars[position]!.branch.hanja, "branch")} href={branchHref(pillars[position]!.branch.hanja)} /></td>
            ))}
          </tr>
          <tr>
            <th scope="row">십성</th>
            {CHART_COLUMNS.filter((position) => !blank(position)).map((position) => <td className={cell(position)} key={position}><TenGodText name={branchTenGod(chart, position)} /></td>)}
          </tr>
          <tr>
            <th scope="row">지장간</th>
            {CHART_COLUMNS.filter((position) => !blank(position)).map((position) => (
              <td className={cell(position)} key={position}>
                <span className={styles.hidden}>
                  {chart.hiddenStems[position]?.map((hidden, index) => <span key={index}><b>{hidden.stem.hanja}</b><i>{hidden.tenGod ?? "—"}</i></span>) ?? "—"}
                </span>
              </td>
            ))}
          </tr>
          <tr>
            <th scope="row">12운성</th>
            {CHART_COLUMNS.filter((position) => !blank(position)).map((position) => <td className={cell(position)} key={position}>{chart.twelveStages[position]?.korean ?? "—"}</td>)}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/**
 * A chart ten god that opens its dictionary page in a new tab: the result is never stored, so leaving
 * this tab would lose it. "—" and unknown names stay plain text.
 */
function TenGodText({ name }: { name: string | null | undefined }) {
  const slug = tenGodSlugOf(name);
  if (!slug) return <span className={styles.tenGod}>{name ?? "—"}</span>;
  return (
    <Link className={`${styles.tenGod} ${styles.termLink}`} href={tenGodPath(slug)} rel="noopener" target="_blank">
      {name}<span className="sr-only"> 뜻 보기</span>
    </Link>
  );
}

function ElementCells({ chart }: { chart: ManseryeokChart }) {
  const cells = elementCellCount(chart);
  return (
    <ul className={styles.elementCells} aria-label="오행별 글자 수">
      {ELEMENT_ORDER.map((element) => (
        <li key={element}>
          {/* Each element opens its dictionary page; the label reads the count first, as the cells show. */}
          <Link aria-label={`${ELEMENT_NAMES[element]} ${chart.fiveElements[element]}개, ${ELEMENT_NAMES[element]} 뜻 보기`} className={styles.elementLink} href={elementPath(element)} rel="noopener" target="_blank">
            <span className={styles.pips} aria-hidden="true">
              {Array.from({ length: cells }, (_, index) => <i className={index < chart.fiveElements[element] ? styles[element] : styles.off} key={index} />)}
            </span>
            <strong aria-hidden="true">{chart.fiveElements[element]}</strong>
            <span aria-hidden="true">{ELEMENT_NAMES[element]}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function VoidLine({ chart }: { chart: ManseryeokChart }) {
  const day = chart.voids.day;
  const year = chart.voids.year;
  if (!day && !year) return <p className={styles.muted}>태어난 시각 후보에 따라 갈려서 공망은 확정하지 않았어요.</p>;
  const branches = new Set(CHART_COLUMNS.map((position) => chart.chart.pillars[position]?.branch.hanja).filter(Boolean));
  const shown = day ?? year!;
  const inChart = Array.from(shown.hanja).filter((value) => branches.has(value));
  return (
    <div className={styles.voidLine}>
      <span className={styles.hanLarge}>{Array.from(shown.hanja).join(" ")}</span>
      <p>
        {day ? `일주 기준 · ${Array.from(day.korean).join(" · ")}` : null}
        {day && year ? <br /> : null}
        {year ? (day && year.hanja === day.hanja ? "연주 기준도 같아요." : `연주 기준 · ${Array.from(year.korean).join(" · ")}`) : null}
        <br />
        {inChart.length ? `원국의 지지에 ${inChart.join("·")} 글자가 있어요.` : "원국의 네 지지에는 없어요."}
      </p>
    </div>
  );
}

function LuckSection({ chart, birth, today, onEdit }: { chart: ManseryeokChart; birth: SajuBirthValues; today: number; onEdit: (focusField?: "luck") => void }) {
  const luck = chart.luckCycle;
  if (!luck) {
    const reason = birth.luckDirectionBasis === "unspecified"
      ? "성별을 고르지 않아 대운은 계산하지 않았어요."
      : "태어난 시각 후보에 따라 대운 시작이 갈려서 계산하지 않았어요.";
    return (
      <div className={styles.why}>
        <p><strong>{reason}</strong> {birth.luckDirectionBasis === "unspecified" ? "대운이 흐르는 방향을 정할 수 없어서, 명식표와 세운·월운은 그대로 보여 드려요." : "명식표와 세운·월운은 그대로 보여 드려요."}</p>
        {birth.luckDirectionBasis === "unspecified" ? <button className="secondary-button" onClick={() => onEdit("luck")} type="button">성별 고르고 다시 계산하기</button> : null}
      </div>
    );
  }
  const now = currentLuckIndex(chart, today);
  return (
    <LuckStrip luck={luck} now={now} />
  );
}

function LuckStrip({ luck, now }: { luck: NonNullable<ManseryeokChart["luckCycle"]>; now: number }) {
  const stripRef = useRef<HTMLOListElement>(null);
  useShowCurrent(stripRef, now);
  return (
    <>
      <dl className={styles.start}>
        <div><dt>대운수</dt><dd>{luck.integerStartAge}</dd></div>
        <div><dt>정밀 시작 시점</dt><dd>{formatMonth(luck.precise.startDate)} 무렵 · 만 {luck.precise.startAgeYears}세 {luck.precise.startAgeMonths}개월</dd></div>
        <div><dt>방향</dt><dd>{luck.precise.direction === "forward" ? "순행" : "역행"}</dd></div>
      </dl>
      {/* The years match how the AI saju names a luck period; the small number follows 대운수, not a counted age. */}
      <ol className={styles.strip} aria-label="대운 흐름" ref={stripRef} tabIndex={0}>
        {luck.periods.map((period, index) => (
          <li className={index === now ? styles.now : undefined} key={period.startYear}>
            <span className={`${styles.age} ${styles.range}`}>{period.startYear}–{period.endYear}</span>
            <span className={styles.year}>{luck.integerStartAge + index * 10}{index === now ? " · 지금" : ""}</span>
            {period.stemTenGod ? <span className={styles.tenGod}>{period.stemTenGod}</span> : null}
            <GlyphChar glyph={glyph(period.ganZhi.hanja[0] ?? "", "stem")} /><GlyphChar glyph={glyph(period.ganZhi.hanja[1] ?? "", "branch")} />
          </li>
        ))}
      </ol>
      <p className={styles.muted}>칸의 큰 숫자는 대운이 이어지는 해, 작은 숫자는 대운수 기준 나이예요. 대운수는 정밀 시작 시점(만 {luck.precise.startAgeYears}세 {luck.precise.startAgeMonths}개월)을 반올림한 값이에요.</p>
    </>
  );
}

function MonthlyCards({ chart, state, today }: { chart: ManseryeokChart | null; state: ManseryeokResultProps["monthlyState"]; today: number }) {
  if (state === "limited") return <p className={styles.muted} role="alert">1분 뒤에 다시 시도해 주세요.</p>;
  if (state === "failed") return <p className={styles.muted} role="alert">내년 월운을 불러오지 못했어요. 잠시 뒤에 다시 눌러 주세요.</p>;
  if (!chart) return <p className={styles.muted} aria-live="polite">내년 월운을 계산하고 있어요.</p>;
  const calendar = chart.monthlyCalendar;
  const nowMonth = calendar.targetYear === today ? Number(new Intl.DateTimeFormat("en", { month: "numeric", timeZone: "Asia/Seoul" }).format(new Date())) : 0;
  return (
    <ol className={styles.months} aria-label={`${calendar.targetYear}년 월운`}>
      {calendar.months.map((month) => {
        const [before, after] = month.periods;
        const term = termStart(after.startInclusive);
        const beforeGlyphs = ganZhiGlyphs(before.monthGanZhi);
        const afterGlyphs = ganZhiGlyphs(after.monthGanZhi);
        return (
          <li className={month.month === nowMonth ? styles.now : undefined} key={month.month}>
            <div className={styles.monthHead}>{month.month}월{month.month === nowMonth ? " · 지금" : ""}<span>절입 {term.day}일 {term.clock}</span></div>
            <div className={styles.segment}>전{beforeGlyphs ? <span>{beforeGlyphs[0].hanja}{beforeGlyphs[1].hanja}</span> : <span>{before.monthGanZhi}</span>}</div>
            <div className={`${styles.segment} ${styles.after}`}>후{afterGlyphs ? <span>{afterGlyphs[0].hanja}{afterGlyphs[1].hanja}</span> : <span>{after.monthGanZhi}</span>}</div>
          </li>
        );
      })}
    </ol>
  );
}

function CorrectedTimeBox({ time }: { time: ReturnType<typeof correctedTime> }) {
  if (time.kind === "none") return <p className={styles.fixNone}>보정할 시각이 없어서 보정 시각은 못 보여 드려요.</p>;
  if (time.kind === "approximate") {
    return <div className={styles.fix}><s>{time.input}</s><span aria-hidden="true">→</span><div><b>{time.from} ~ {time.to}</b><small>앞뒤 60분을 태양 기준으로 보정한 범위</small></div></div>;
  }
  return <div className={styles.fix}><s>{time.input}</s><span aria-hidden="true">→</span><div><b>{time.corrected}</b><small>태양 기준으로 보정한 시각</small></div></div>;
}

function BasisList({ chart, time, place }: { chart: ManseryeokChart; time: ReturnType<typeof correctedTime>; place: string }) {
  const correction = chart.timeCorrection;
  const options = chart.appliedOptions;
  const coordinate = options.coordinateSource === "reference" ? "시각 미상 · 기준 경도" : `${place || "출생 지역"} · 동경 ${options.longitude.toFixed(2)}°`;
  return (
    <dl className={styles.basis}>
      {time.kind !== "none" && correction ? (
        <>
          <dt>입력 시각</dt><dd>{time.input}</dd>
          <dt>보정한 시각</dt><dd>{time.kind === "exact" ? time.corrected : `${time.from} ~ ${time.to}`} <span className={styles.muted}>(경도 {signedMinutes(correction.longitudeCorrectionMinutes)} · 균시차 {signedMinutes(correction.equationOfTimeMinutes)})</span></dd>
        </>
      ) : null}
      <dt>경도 기준</dt><dd>{coordinate}</dd>
      <dt>하루가 바뀌는 시각</dt><dd>{options.dayBoundary === "HOUR_23" ? "23시" : "자정(00시)"}</dd>
      <dt>균시차 보정</dt><dd>{options.equationOfTime ? "적용" : "제외"}</dd>
      {chart.uncertainty.precision === "approximate" ? <><dt>시각 후보</dt><dd>앞뒤 60분 안 {chart.uncertainty.candidateCount}개 후보에서 공통된 값만 보여 드려요.</dd></> : null}
    </dl>
  );
}

function formatMonth(value: string): string {
  const match = /^(\d{4})-(\d{2})/.exec(value);
  return match ? `${match[1]}년 ${Number(match[2])}월` : value;
}

