import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import {
  Breadcrumbs,
  ElementCycle,
  JudgeTable,
  NumberedSections,
  Paragraphs,
  styles,
} from "@/components/saju-dictionary/dictionary-parts";
import { symbolInfo } from "@/domain/saju/exploration";
import { BASICS, BASICS_EXAMPLE, BASICS_PATH, DICTIONARY, DICTIONARY_PATH } from "@/domain/saju-dictionary";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

export const metadata = publicPageMetadata(
  BASICS_PATH,
  `${BASICS.title}: 사주·명식·천간·지지·오행·일간·십성 | 명로`,
  "사주를 처음 보는 분을 위해 명식, 천간과 지지, 음양, 오행, 일간, 십성을 순서대로 정리했어요.",
  generatedShareImage(BASICS_PATH, BASICS.title),
);

type ChartFocus = "all" | "rows" | "day";

const CAPTIONS: Record<ChartFocus, string> = {
  all: "예시 명식이에요. 네 기둥에 글자가 두 개씩, 모두 여덟 글자예요.",
  rows: "금색 줄이 천간, 보라색 줄이 지지예요.",
  day: "금색 칸이 일간이에요. 이 명식의 일간은 갑목(甲)이에요.",
};

/** The same example chart in every step; only what is highlighted changes. */
function ExampleChart({ focus }: { focus: ChartFocus }) {
  const cell = (hanja: string, lane: "stem" | "branch", isDay: boolean) => {
    const element = symbolInfo(hanja, lane)?.element;
    const mark = focus === "rows" ? (lane === "stem" ? styles.chartStem : styles.chartBranch)
      : focus === "day" ? (lane === "stem" && isDay ? styles.chartStem : styles.chartDim)
        : "";
    return <span className={`${styles.chartGlyph} ${element ? styles[element] : ""} ${mark}`}>{hanja}</span>;
  };
  return (
    <>
      <div aria-hidden="true" className={styles.exampleChart}>
        <span />
        {BASICS_EXAMPLE.map((column) => <span className={styles.chartLabel} key={column.pillar}>{column.pillar}</span>)}
        <span className={styles.chartLabel}>{focus === "rows" ? "천간" : ""}</span>
        {BASICS_EXAMPLE.map((column) => <Fragment key={column.pillar}>{cell(column.stem, "stem", column.pillar === "일주")}</Fragment>)}
        <span className={styles.chartLabel}>{focus === "rows" ? "지지" : ""}</span>
        {BASICS_EXAMPLE.map((column) => <Fragment key={column.pillar}>{cell(column.branch, "branch", false)}</Fragment>)}
      </div>
      <p className={styles.caption}>{CAPTIONS[focus]}</p>
    </>
  );
}

const VISUALS: Partial<Record<(typeof BASICS.steps)[number]["id"], ReactNode>> = {
  chart: <ExampleChart focus="all" />,
  ganji: <ExampleChart focus="rows" />,
  elements: <ElementCycle />,
  daymaster: <ExampleChart focus="day" />,
  tengods: (
    <>
      <JudgeTable />
      <p className={styles.caption}>표의 이름을 누르면 그 십성 설명으로 이동해요.</p>
    </>
  ),
};

export default function SajuBasicsPage() {
  const sections = BASICS.steps.map((step) => ({
    id: step.id,
    title: step.title,
    body: (
      <>
        <Paragraphs items={step.paragraphs} />
        {VISUALS[step.id] ?? null}
      </>
    ),
  }));

  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <Breadcrumbs trail={[{ label: BASICS.title }]} />
      <h1>{BASICS.title}</h1>
      <p className="flow-lead">{BASICS.lead}</p>

      <NumberedSections sections={sections} />

      <section aria-labelledby="basics-next" className={styles.related}>
        <h2 id="basics-next">다음으로 읽기</h2>
        <ul className={styles.links}>
          <li><Link href={`${DICTIONARY_PATH}#dictionary-ten-gods`}>십성 열 가지</Link></li>
          <li><Link href={`${DICTIONARY_PATH}#dictionary-elements`}>오행 다섯 가지</Link></li>
          <li><Link href={DICTIONARY_PATH}>사주 개념 사전</Link></li>
        </ul>
      </section>
      <div className={styles.ctas}>
        <Link className="primary-button" href="/manseryeok">무료 만세력으로 내 명식 보기</Link>
      </div>
      <p className={styles.disclaimer}>{DICTIONARY.disclaimer}</p>
    </article>
  );
}
