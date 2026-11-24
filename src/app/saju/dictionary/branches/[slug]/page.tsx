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
import { RelationWheel, type WheelLine } from "@/components/saju-dictionary/relation-wheel";
import { ELEMENT_NAMES } from "@/domain/manseryeok/display";
import {
  BRANCH_SLUGS,
  DICTIONARY_PATH,
  branchFacts,
  branchPath,
  branchSlugOf,
  elementAsGroup,
  elementPath,
  getBranch,
  object,
  stemPath,
  stemSlugOf,
  subject,
  type BranchFacts,
  type Glyph,
} from "@/domain/saju-dictionary";
import { ZODIAC_SIGNS, ZODIAC_YEAR_CONTENT } from "@/domain/zodiac-fortune";
import { RELATION_LABELS, type ZodiacRelationKind } from "@/domain/zodiac-fortune/relations";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return BRANCH_SLUGS.map((slug) => ({ slug }));
}

interface BranchPageProps {
  params: Promise<{ slug: string }>;
}

const ALL_BRANCHES = BRANCH_SLUGS.map((slug) => branchFacts(slug).glyph);
const COUNT = ALL_BRANCHES.length;

function named(glyph: Glyph): string {
  return `${glyph.korean}(${glyph.hanja})`;
}

function indexOf(glyph: Glyph): number {
  return ALL_BRANCHES.findIndex((candidate) => candidate.hanja === glyph.hanja);
}

function isNeighbour(a: number, b: number): boolean {
  const gap = Math.abs(a - b) % COUNT;
  return gap === 1 || gap === COUNT - 1;
}

function partnersOf(facts: BranchFacts, kind: ZodiacRelationKind): readonly Glyph[] {
  return [...facts.harmony, ...facts.tension].find((relation) => relation.kind === kind)?.partners ?? [];
}

/** 육합 as a line, 삼합 as a triangle and 방합 as a band along the ring. */
function harmonyWheel(facts: BranchFacts) {
  const self = facts.order - 1;
  const lines: WheelLine[] = partnersOf(facts, "sixHarmony").map((partner) => {
    const to = indexOf(partner);
    return { to, tone: "harmony", label: "육합", at: 0.5, inward: isNeighbour(self, to) ? 30 : undefined };
  });
  const three = partnersOf(facts, "threeHarmony").map(indexOf);
  const season = [self, ...partnersOf(facts, "seasonGroup").map(indexOf)];
  const from = season.find((start) => season.includes((start + 1) % COUNT) && season.includes((start + 2) % COUNT));
  return {
    lines,
    shape: {
      triangle: three.length === 2 ? { members: [self, three[0], three[1]] as [number, number, number], label: "삼합" } : undefined,
      band: from === undefined ? undefined : { from, to: (from + 2) % COUNT, label: "방합" },
    },
  };
}

const TENSION_ORDER: readonly ZodiacRelationKind[] = ["clash", "punishment", "resentment", "harm", "breaking"];

/** One line per partner; kinds sharing a partner (원진·해) share its line and label. */
function tensionLines(facts: BranchFacts): WheelLine[] {
  const self = facts.order - 1;
  const byPartner = new Map<number, ZodiacRelationKind[]>();
  for (const kind of TENSION_ORDER) {
    for (const partner of partnersOf(facts, kind)) byPartner.set(indexOf(partner), [...(byPartner.get(indexOf(partner)) ?? []), kind]);
  }
  return [...byPartner].map(([to, kinds]) => ({
    to,
    tone: "tension",
    label: kinds.map((kind) => RELATION_LABELS[kind]).join(" · "),
    stroke: kinds.includes("clash") ? "solid" : kinds.every((kind) => kind === "breaking") ? "dotted" : "dashed",
    at: kinds.includes("clash") ? 0.62 : isNeighbour(self, to) ? 0.5 : 0.55,
    inward: isNeighbour(self, to) ? 28 : undefined,
  }));
}

function captionOf(facts: BranchFacts, kinds: readonly ZodiacRelationKind[]): string {
  return kinds
    .map((kind) => ({ kind, partners: partnersOf(facts, kind) }))
    .filter((item) => item.partners.length)
    .map((item) => `${RELATION_LABELS[item.kind]} ${item.partners.map((partner) => partner.korean).join("·")}`)
    .join(" · ");
}

export async function generateMetadata({ params }: BranchPageProps) {
  const entry = getBranch((await params).slug);
  if (!entry) return {};
  const { glyph } = branchFacts(entry.slug);
  const path = branchPath(entry.slug);
  const title = `지지 ${named(glyph)}의 뜻`;
  return publicPageMetadata(path, `${title}: 사주 개념 사전 | 명로`, entry.lead, generatedShareImage(path, title));
}

export default async function BranchPage({ params }: BranchPageProps) {
  const entry = getBranch((await params).slug);
  if (!entry) notFound();

  const facts = branchFacts(entry.slug);
  const { glyph } = facts;
  const element = ELEMENT_NAMES[glyph.element];
  const animal = ZODIAC_SIGNS.find((sign) => sign.slug === facts.zodiac)!.shortName;
  const main = facts.hidden[0];
  const clash = partnersOf(facts, "clash")[0];
  const six = partnersOf(facts, "sixHarmony")[0];
  const harmony = harmonyWheel(facts);
  const harmonyCaption = captionOf(facts, ["sixHarmony", "threeHarmony", "seasonGroup"]);
  const tension = tensionLines(facts);
  // The caption lists by relation, like the harmony one, even where two kinds share a line in the drawing.
  const tensionCaption = captionOf(facts, TENSION_ORDER);
  const stemLink = (stem: Glyph) => <Link href={stemPath(stemSlugOf(stem.hanja)!)}>{named(stem)}</Link>;

  const sections = [
    {
      id: "calendar",
      title: "띠와 달, 시간",
      body: (
        <>
          <Paragraphs items={entry.calendar} />
          <ul aria-label={`${glyph.korean}${subject(glyph.korean)} 아래에 오는 다섯 기둥`} className={styles.example}>
            {facts.pillars.map((stem) => (
              <li key={stem.hanja}>
                <span className={styles.glyph}><GlyphText glyph={stem} /><GlyphText glyph={glyph} /></span>
                {stem.korean}{glyph.korean}
              </li>
            ))}
          </ul>
        </>
      ),
    },
    {
      id: "hidden",
      title: "오행·음양과 숨은 천간",
      body: (
        <>
          <Paragraphs items={entry.hidden} />
          <ul aria-label={`${glyph.korean}의 숨은 천간`} className={styles.example}>
            {facts.hidden.map((stem, index) => (
              <li className={index === 0 ? styles.hit : undefined} key={stem.hanja}>
                <span className={styles.glyph}><GlyphText glyph={stem} /></span>
                {stem.korean}{index === 0 ? " · 본기" : ""}
              </li>
            ))}
          </ul>
          <p className={styles.caption}>무료 만세력이 표시하는 숨은 천간이에요. 지지 십성은 본기로 계산해요.</p>
        </>
      ),
    },
    {
      id: "ten-gods",
      title: "일간에 따라 달라지는 십성",
      body: (
        <>
          <Paragraphs items={entry.tenGods} />
          <p className={styles.callout}>
            <strong>본기 {main.korean} 기준 십성 묶음</strong>
            {elementAsGroup(main.element).map(({ day, group }) => `${ELEMENT_NAMES[day]} 일간 ${group.name}`).join(" · ")}
          </p>
          <DayTenGodChips current={main.hanja} items={facts.byDay} label={`일간마다 ${glyph.korean}${subject(glyph.korean)} 갖는 십성`} />
          <p className={styles.caption}>본기 {main.korean}{object(main.korean)} 기준으로 한 일간별 십성이에요.</p>
        </>
      ),
    },
    {
      id: "relations",
      title: "다른 지지와의 관계",
      body: (
        <>
          <Paragraphs items={entry.relations} />
          <div className={styles.wheels}>
            <RelationWheel
              caption={harmonyCaption}
              glyphs={ALL_BRANCHES}
              label={`${glyph.korean}${subject(glyph.korean)} 묶이는 지지: ${harmonyCaption}`}
              lines={harmony.lines}
              self={facts.order - 1}
              shape={harmony.shape}
              title="묶이는 관계"
            />
            <RelationWheel
              caption={tensionCaption}
              glyphs={ALL_BRANCHES}
              label={`${glyph.korean}${subject(glyph.korean)} 마주 보거나 어긋나는 지지: ${tensionCaption}`}
              lines={tension}
              self={facts.order - 1}
              title="마주 보거나 어긋나는 관계"
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
          <div className={styles.zodiacCard}>
            <div>
              <b>{animal}띠 {ZODIAC_YEAR_CONTENT.year} 신년운세</b>
              <small>{glyph.korean}{subject(glyph.korean)} 연주 아래 글자인 해에 태어난 띠</small>
            </div>
            <Link href={`/zodiac/${facts.zodiac}`}>보러 가기 →</Link>
          </div>
        </>
      ),
    },
  ];

  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <Breadcrumbs trail={[{ label: "지지", href: `${DICTIONARY_PATH}#dictionary-branches` }, { label: glyph.korean }]} />
      <h1>{glyph.korean}{" "}<span className={`${styles.han} ${styles[glyph.element]}`} lang="zh-Hant">{glyph.hanja}</span></h1>
      <p className="flow-lead">{entry.lead}</p>

      <section aria-labelledby="branch-glance" className={styles.box}>
        <h2 id="branch-glance">한눈에 보기</h2>
        <dl className={styles.meta}>
          <div><dt>순서 · 띠</dt><dd>지지 {facts.order}번째 · {animal}</dd></div>
          <div><dt>오행 · 음양</dt><dd>{element} · {glyph.yang ? "양" : "음"}</dd></div>
          <div><dt>달 · 시간</dt><dd>음력 {facts.month}월({facts.term}부터) · {facts.hours[0]}~{facts.hours[1]}시</dd></div>
          <div><dt>계절</dt><dd>{facts.season}</dd></div>
          <div>
            <dt>숨은 천간</dt>
            <dd>
              {facts.hidden.map((stem, index) => <span key={stem.hanja}>{index ? " · " : ""}{stemLink(stem)}</span>)}
              {facts.hidden.length > 1 ? `, 본기 ${main.korean}` : " (본기)"}
            </dd>
          </div>
          <div><dt>충</dt><dd>{clash ? <Link href={branchPath(branchSlugOf(clash.hanja)!)}>{named(clash)}</Link> : "없음"}</dd></div>
        </dl>
        {/* Readers who arrive from a chart cell want this glyph's ten god for their own day stem first. */}
        <a className={styles.glanceJump} href="#ten-gods">내 일간 기준 십성 보기 <span aria-hidden="true">↓</span></a>
      </section>

      <NumberedSections sections={sections} />

      <DetailFooter
        browse={{
          title: "지지 열두 글자",
          wide: true,
          items: BRANCH_SLUGS.map((slug, index) => ({ label: ALL_BRANCHES[index].korean, href: branchPath(slug), current: slug === entry.slug })),
        }}
        related={[
          { label: `오행 ${element}`, href: elementPath(glyph.element) },
          { label: `천간 ${main.korean}`, href: stemPath(stemSlugOf(main.hanja)!) },
          ...(six ? [{ label: six.korean, href: branchPath(branchSlugOf(six.hanja)!) }] : []),
          ...(clash ? [{ label: clash.korean, href: branchPath(branchSlugOf(clash.hanja)!) }] : []),
          { label: `${animal}띠 신년운세`, href: `/zodiac/${facts.zodiac}` },
        ]}
      />
    </article>
  );
}
