import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumbs,
  DayTenGodChips,
  DetailFooter,
  GlyphText,
  NumberedSections,
  Paragraphs,
  styles,
} from "@/components/saju-dictionary/dictionary-parts";
import { RelationWheel } from "@/components/saju-dictionary/relation-wheel";
import { ELEMENT_NAMES } from "@/domain/manseryeok/display";
import {
  DICTIONARY_PATH,
  STEM_SLUGS,
  elementFacts,
  elementPath,
  getStem,
  stemFacts,
  stemPath,
  stemSlugOf,
  subject,
  withAnd,
  type Glyph,
} from "@/domain/saju-dictionary";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return STEM_SLUGS.map((slug) => ({ slug }));
}

interface StemPageProps {
  params: Promise<{ slug: string }>;
}

const ALL_STEMS = STEM_SLUGS.map((slug) => stemFacts(slug).glyph);

function named(glyph: Glyph): string {
  return `${glyph.korean}(${glyph.hanja})`;
}

function linkTo(glyph: Glyph) {
  return <Link href={stemPath(stemSlugOf(glyph.hanja)!)}>{named(glyph)}</Link>;
}

export async function generateMetadata({ params }: StemPageProps) {
  const entry = getStem((await params).slug);
  if (!entry) return {};
  const { glyph } = stemFacts(entry.slug);
  const path = stemPath(entry.slug);
  const title = `천간 ${named(glyph)}의 뜻`;
  return publicPageMetadata(path, `${title}: 사주 개념 사전 | 명로`, entry.lead, generatedShareImage(path, title));
}

export default async function StemPage({ params }: StemPageProps) {
  const entry = getStem((await params).slug);
  if (!entry) notFound();

  const facts = stemFacts(entry.slug);
  const { glyph } = facts;
  const element = ELEMENT_NAMES[glyph.element];
  const polarity = glyph.yang ? "양" : "음";
  const relationText = [
    facts.combination ? `합 · ${named(facts.combination)}${withAnd(facts.combination.korean)} 묶임` : null,
    facts.clash ? `충 · ${named(facts.clash)}${withAnd(facts.clash.korean)} 마주 봄` : "충을 이루는 천간 없음",
  ].filter(Boolean).join(" · ");

  const cycle = elementFacts(glyph.element);
  const stemsOf = (element: Glyph["element"]) => ALL_STEMS.filter((candidate) => candidate.element === element).map((candidate) => candidate.korean).join("·");

  const sections = [
    {
      id: "place",
      title: `${glyph.korean}의 자리`,
      body: (
        <>
          <Paragraphs items={entry.place} />
          <ul aria-label={`${glyph.korean}${subject(glyph.korean)} 위에 오는 여섯 기둥`} className={styles.example}>
            {facts.pillars.map((branch) => (
              <li key={branch.hanja}>
                <span className={styles.glyph}><GlyphText glyph={glyph} /><GlyphText glyph={branch} /></span>
                {glyph.korean}{branch.korean}
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "cycle",
      title: `${element}의 생극에서 본 다른 천간`,
      body: (
        <>
          <Paragraphs items={entry.cycle} />
          <p className={styles.callout}>
            <strong>{glyph.korean} 일간 기준 십성 묶음</strong>
            인성 {stemsOf(cycle.generatedBy)} · 식상 {stemsOf(cycle.generates)} · 재성 {stemsOf(cycle.controls)} · 관성 {stemsOf(cycle.controlledBy)} · 비겁 {stemsOf(glyph.element)}
          </p>
        </>
      ),
    },
    {
      id: "ten-gods",
      title: "일간에 따라 달라지는 십성",
      body: (
        <>
          <Paragraphs items={entry.tenGods} />
          <DayTenGodChips current={glyph.hanja} items={facts.byDay} label={`일간마다 ${glyph.korean}${subject(glyph.korean)} 갖는 십성`} />
          <p className={styles.caption}>일간마다 {glyph.korean}의 십성이에요. 이름을 누르면 십성 설명으로 가요.</p>
        </>
      ),
    },
    {
      id: "relations",
      title: "다른 천간과의 관계",
      body: (
        <>
          <Paragraphs items={entry.relations} />
          <div className={`${styles.wheels} ${styles.wheelSingle}`}>
            <RelationWheel
              caption={relationText}
              glyphs={ALL_STEMS}
              label={`${glyph.korean}의 합과 충: ${relationText}`}
              lines={[
                ...(facts.combination ? [{ to: ALL_STEMS.findIndex((g) => g.hanja === facts.combination!.hanja), tone: "harmony" as const, label: "합", at: 0.5 }] : []),
                ...(facts.clash ? [{ to: ALL_STEMS.findIndex((g) => g.hanja === facts.clash!.hanja), tone: "tension" as const, label: "충", stroke: "dashed" as const, at: 0.62 }] : []),
              ]}
              self={facts.order - 1}
            />
          </div>
        </>
      ),
    },
    {
      id: "find",
      title: "만세력에서 찾는 법",
      body: (
        <>
          <Paragraphs items={entry.find} />
          <ul aria-label={`${glyph.korean}${subject(glyph.korean)} 숨어 있는 지지`} className={styles.example}>
            {facts.hiddenIn.map(({ branch, main }) => (
              <li className={main ? styles.hit : undefined} key={branch.hanja}>
                <span className={styles.glyph}><GlyphText glyph={branch} /></span>
                {branch.korean} · {main ? "본기" : "지장간"}
              </li>
            ))}
          </ul>
        </>
      ),
    },
  ];

  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <Breadcrumbs trail={[{ label: "천간", href: `${DICTIONARY_PATH}#dictionary-stems` }, { label: glyph.korean }]} />
      <h1>{glyph.korean}{" "}<span className={`${styles.han} ${styles[glyph.element]}`} lang="zh-Hant">{glyph.hanja}</span></h1>
      <p className="flow-lead">{entry.lead}</p>

      <section aria-labelledby="stem-glance" className={styles.box}>
        <h2 id="stem-glance">한눈에 보기</h2>
        <dl className={styles.meta}>
          <div><dt>순서</dt><dd>천간 {facts.order}번째</dd></div>
          <div><dt>오행 · 음양</dt><dd>{element} · {polarity}</dd></div>
          <div><dt>같은 오행의 짝</dt><dd>{linkTo(facts.pair)} · {facts.pair.yang ? "양" : "음"}의 {element}</dd></div>
          <div>
            <dt>천간의 합 · 충</dt>
            <dd>
              {facts.combination ? <>{linkTo(facts.combination)}{withAnd(facts.combination.korean)} 합</> : null}
              {" · "}
              {facts.clash ? <>{linkTo(facts.clash)}{withAnd(facts.clash.korean)} 충</> : "충 없음"}
            </dd>
          </div>
        </dl>
      </section>

      <NumberedSections sections={sections} />

      <DetailFooter
        browse={{
          title: "천간 열 글자",
          items: STEM_SLUGS.map((slug, index) => ({ label: ALL_STEMS[index].korean, href: stemPath(slug), current: slug === entry.slug })),
        }}
        related={[
          { label: `오행 ${element}`, href: elementPath(glyph.element) },
          { label: facts.pair.korean, href: stemPath(stemSlugOf(facts.pair.hanja)!) },
          ...(facts.combination ? [{ label: facts.combination.korean, href: stemPath(stemSlugOf(facts.combination.hanja)!) }] : []),
          ...(facts.clash ? [{ label: facts.clash.korean, href: stemPath(stemSlugOf(facts.clash.hanja)!) }] : []),
          { label: "사주 개념 사전 전체", href: DICTIONARY_PATH },
        ]}
      />
    </article>
  );
}
