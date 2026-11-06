"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import { annualCalendar, ANNUAL_BASE_EVIDENCE, type SajuAnnualReadingView } from "@/domain/saju/annual-result";
import { getSajuCurrentYear } from "@/domain/saju/monthly-calendar";
import type { SajuEvidenceKey } from "@/domain/saju/result";
import { redirectedReadingNotice } from "@/domain/reading/reading-mode";
import { AiGeneratedNotice } from "./ai-generated-notice";
import { ReadingModeNotice } from "./reading-mode-notice";
import { SajuCalculationExplorer } from "./saju-calculation-explorer";
import { LIMITATION_COPY } from "./saju-reading-result";
import styles from "./saju-annual-reading-result.module.css";

function defaultMonth(year: number) {
  return year === getSajuCurrentYear() ? Number(new Intl.DateTimeFormat("en", { month: "numeric", timeZone: "Asia/Seoul" }).format(new Date())) : 1;
}
const dateParts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
// Seconds and the year add nothing a reader can use; a month boundary at midnight is just the date.
function date(value: string) {
  const parts = Object.fromEntries(dateParts.formatToParts(new Date(value)).map((part) => [part.type, part.value]));
  const day = `${Number(parts.month)}월 ${Number(parts.day)}일`;
  return parts.hour === "00" && parts.minute === "00" ? day : `${day} ${parts.hour}:${parts.minute}`;
}
function Range({ start, end }: { start: string; end: string }) {
  return <><time dateTime={start}>{date(start)}</time>부터 <time dateTime={end}>{date(end)}</time> 전까지</>;
}
const SMALL_SCREEN = "(max-width: 600px)";

export function SajuAnnualReadingResult({ view, backHref = "/saju", backLabel = "사주 리딩", footer }: {
  view: SajuAnnualReadingView; backHref?: string; backLabel?: string; footer?: ReactNode;
}) {
  const { result, input } = view;
  const snapshot = input.calculationSnapshot;
  const calendar = annualCalendar(snapshot.monthlyCalendar);
  const [month, setMonth] = useState(1);
  const detailRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const restore = () => {
      const value = new URL(window.location.href).searchParams.get("month");
      setMonth(value && /^(?:[1-9]|1[0-2])$/.test(value) ? Number(value) : defaultMonth(input.targetYear));
    };
    restore();
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, [view.id, input.targetYear]);
  const select = (value: number) => {
    setMonth(value);
    const url = new URL(window.location.href);
    url.searchParams.set("month", String(value));
    window.history.replaceState(window.history.state, "", url);
    // On a phone the twelve buttons fill the screen, so the changed detail would stay out of view.
    if (window.matchMedia?.(SMALL_SCREEN).matches) {
      const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      requestAnimationFrame(() => detailRef.current?.scrollIntoView({ block: "start", behavior: smooth ? "smooth" : "auto" }));
    }
  };
  const selected = result.months[month - 1];
  const slices = snapshot.monthlyCalendar.months[month - 1].periods;
  const ids = calendar.months[month - 1].periodIds;
  const links = [{ ...result.annualOverview, id: "annual-overview" },
    { ...selected, id: "annual-month-detail" },
    ...(result.questionReading ? [{ ...result.questionReading, id: "annual-question" }] : []),
  ].map((item) => ({ ...item, evidenceKeys: item.evidenceKeys.filter((key): key is SajuEvidenceKey => ANNUAL_BASE_EVIDENCE.includes(key as SajuEvidenceKey)) }));
  return <article className={`saju-result page-width ${styles.report}`}>
    <Link className="back-link" href={backHref}>← {backLabel}</Link>
    <AiGeneratedNotice />
    <ReadingModeNotice notice={redirectedReadingNotice(result.readingMode, result.questionRedirected)} />
    <header className="saju-result-hero"><p className="eyebrow">AI SAJU · {input.targetYear} 한 해 리포트</p><h1>{result.title}</h1></header>
    {result.detailLevel === "brief" ? <aside className="notice">출생 시각을 확정할 수 없어 나를 읽는 기준(일간)도 하나로 정할 수 없었어요. 그래서 간략형으로 제공합니다. 연간 개요와 월별 요약, 계산된 적용 구간을 함께 살펴보세요.</aside> : null}
    <section id="annual-overview" className={styles.section} tabIndex={-1}><h2>{result.annualOverview.heading}</h2><p>{result.annualOverview.body}</p></section>
    <section aria-labelledby="annual-months-heading" className={styles.section}>
      <h2 id="annual-months-heading">12개월의 흐름</h2>
      <p>궁금한 달을 선택해 보세요. 절입은 계절의 흐름이 바뀌는 시점으로, 달력의 첫날과 다릅니다. 사주의 해도 1월 1일이 아니라 입춘(2월 4일 무렵)에 바뀝니다.</p>
      <div className={styles.months} role="group" aria-label="살펴볼 달">
        {result.months.map((item) => <button key={item.month} id={`annual-month-${item.month}`} type="button" aria-pressed={month === item.month} aria-controls="annual-month-detail" onClick={() => select(item.month)} className={styles.month}>
          <strong>{item.month}월{month === item.month ? " · 선택됨" : ""}</strong><span>{item.heading}</span>
        </button>)}
      </div>
    </section>
    <section ref={detailRef} id="annual-month-detail" aria-labelledby="annual-selected-heading" className={styles.detail} tabIndex={-1}>
      <h2 id="annual-selected-heading" aria-live="polite">{month}월 · {selected.heading}</h2><p>{selected.body}</p>
      {result.detailLevel === "brief" ? <section className={styles.intervals} aria-label={`${month}월 적용 구간`}>
        <h3>적용 구간 · 한국 시각</h3>
        <ul>{slices.map((slice, index) => <li key={index}>
          절입 {index === 0 ? "전" : "후"} · <Range start={slice.startInclusive} end={slice.endExclusive} />
          {slice.yearGanZhi !== snapshot.annualFortune.ganZhi ? <span className={styles.yearNote}> · 입춘 전이라 사주에서는 아직 지난해에 속합니다.</span> : null}
        </li>)}</ul>
      </section> : slices.map((slice, index) => {
        const id = ids[index];
        const interpretation = result.periods.find((period) => period.periodId === id);
        const shared = index === 0 && month > 1 && calendar.months[month - 2].periodIds.at(-1) === id;
        return <section className={styles.period} key={index} aria-label={`${month}월 절입 ${index === 0 ? "전" : "후"}`}>
          <h3>절입 {index === 0 ? "전" : "후"}{interpretation ? ` · ${interpretation.heading}` : ""}</h3>
          <p className={styles.dates}><Range start={slice.startInclusive} end={slice.endExclusive} /> · 한국 시각</p>
          {slice.yearGanZhi !== snapshot.annualFortune.ganZhi ? <p className={styles.yearNote}>입춘 전이라 사주에서는 아직 지난해에 속합니다.</p> : null}
          {shared ? <p className={styles.shared}>앞달 후반과 이어지는 구간{interpretation ? " · 같은 구간의 해석을 함께 읽습니다." : ""}</p> : null}
          {interpretation ? <p>{interpretation.body}</p> : null}
        </section>;
      })}
    </section>
    {result.questionReading ? <section id="annual-question" className={styles.section} tabIndex={-1}><h2>{result.questionReading.heading}</h2><p>{result.questionReading.body}</p></section> : null}
    <section className="saju-reading-summary"><h2>한 해를 마무리하며</h2><p>{result.summary}</p></section>
    <details className={`saju-calculation ${styles.calculation}`}><summary>내 사주 탐색 · 명식과 계산 기준 보기</summary>
      <SajuCalculationExplorer snapshot={snapshot} links={links} />
      <p>{snapshot.targetYear}년 세운 {snapshot.annualFortune.ganZhi} · 월운은 절입 기준으로 계산했습니다.</p>
      <p className={styles.valuesTitle}>{month}월의 계산값</p>
      <dl className={styles.monthValues}>
        {slices.map((slice, index) => <div key={index}>
          <dt>{month}월 절입 {index === 0 ? "전" : "후"}</dt>
          <dd>연간지 {slice.yearGanZhi} · 월간지 {slice.monthGanZhi}{slice.stemTenGod ? ` · 십성 ${slice.stemTenGod}` : ""}</dd>
        </div>)}
      </dl>
    </details>
    <section className="saju-limitations"><h2>계산 제한사항</h2>{snapshot.limitations.length ? <ul>{snapshot.limitations.map((code) => {
      const copy = LIMITATION_COPY[code] ?? { title: "추가 계산 제한사항", body: "일부 계산은 확정할 수 있는 범위만 결과에 반영했습니다." };
      return <li key={code}><strong>{copy.title}</strong><span>{copy.body}</span></li>;
    })}</ul> : <p>별도의 계산 제한사항이 없습니다.</p>}</section>
    <p className="reading-disclaimer">{result.disclaimer}</p>
    <div className="result-actions saju-result-actions"><Link className="primary-button" href="/saju">새 사주 리딩</Link><Link className="secondary-button" href="/records">내 기록 보기</Link></div>
    {/* The records page sends this from the server; as one of the article's children it was checked for a list key. */}
    <Fragment>{footer}</Fragment>
  </article>;
}
