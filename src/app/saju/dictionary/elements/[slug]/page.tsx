import { notFound } from "next/navigation";

import {
  Breadcrumbs,
  DetailFooter,
  GlyphText,
  NumberedSections,
  Paragraphs,
  styles,
} from "@/components/saju-dictionary/dictionary-parts";
import {
  DICTIONARY,
  DICTIONARY_PATH,
  ELEMENT_SLUGS,
  elementAsGroup,
  elementFacts,
  elementPath,
  evenIf,
  getElement,
  object,
  subject,
  topic,
} from "@/domain/saju-dictionary";
import { ELEMENT_NAMES } from "@/domain/manseryeok/display";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return ELEMENT_SLUGS.map((slug) => ({ slug }));
}

interface ElementPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: ElementPageProps) {
  const entry = getElement((await params).slug);
  if (!entry) return {};
  const path = elementPath(entry.slug);
  const title = `오행 ${ELEMENT_NAMES[entry.slug]}(${entry.hanja})의 뜻`;
  return publicPageMetadata(path, `${title}: 사주 개념 사전 | 명로`, entry.lead, generatedShareImage(path, title));
}

export default async function ElementPage({ params }: ElementPageProps) {
  const entry = getElement((await params).slug);
  if (!entry) notFound();

  const facts = elementFacts(entry.slug);
  const name = facts.name;
  const glyphs = [...facts.stems, ...facts.branches];
  const named = (slug: keyof typeof ELEMENT_NAMES) => ELEMENT_NAMES[slug];

  const sections = [
    { id: "nature", title: `${name}${topic(name)} 무엇을 상징하나요`, body: <Paragraphs items={entry.nature} /> },
    {
      id: "cycle",
      title: "상생과 상극에서의 자리",
      body: (
        <>
          <Paragraphs items={entry.cycle} />
          <p className={styles.callout}>
            <strong>{name}{object(name)} 기준으로 정리하면</strong>
            나를 낳는 오행 {named(facts.generatedBy)} · 내가 낳는 오행 {named(facts.generates)} · 내가 극하는 오행 {named(facts.controls)} · 나를 극하는 오행 {named(facts.controlledBy)}
          </p>
        </>
      ),
    },
    {
      id: "chars",
      title: `${name}에 속하는 천간과 지지`,
      body: (
        <>
          <Paragraphs items={entry.chars} />
          <ul aria-label={`${name}에 속하는 글자`} className={styles.example}>
            {glyphs.map((glyph) => (
              <li key={glyph.hanja}>
                <span className={styles.glyph}><GlyphText glyph={glyph} /></span>
                {glyph.korean} · {facts.stems.includes(glyph) ? "천간" : "지지"} · {glyph.yang ? "양" : "음"}
              </li>
            ))}
          </ul>
        </>
      ),
    },
    { id: "count", title: "많을 때와 적을 때의 오해", body: <Paragraphs items={entry.count} /> },
    {
      id: "ten-gods",
      title: "일간에 따라 달라지는 십성",
      body: (
        <>
          <p>같은 {name}{evenIf(name)} 일간의 오행에 따라 십성 묶음이 달라집니다. 아래 표는 십성 판정표를 {name}에 그대로 적용한 결과입니다.</p>
          <table className={styles.byDay}>
            <thead><tr><th scope="col">일간의 오행</th><th scope="col">{name}의 십성 묶음</th><th scope="col">관계</th></tr></thead>
            <tbody>
              {elementAsGroup(entry.slug).map(({ day, group }) => (
                <tr key={day}>
                  <th scope="row"><span className={styles[day]}>{ELEMENT_NAMES[day]}</span> 일간</th>
                  <td>{group.name}</td>
                  <td>{group.relation}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ),
    },
    { id: "read", title: "만세력 '오행 분포' 읽는 법", body: <Paragraphs items={entry.read} /> },
  ];

  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <Breadcrumbs trail={[{ label: "오행", href: `${DICTIONARY_PATH}#dictionary-elements` }, { label: name }]} />
      <h1>{name}{" "}<span className={`${styles.han} ${styles[entry.slug]}`} lang="zh-Hant">{entry.hanja}</span></h1>
      <p className="flow-lead">{entry.lead}</p>
      <p className={styles.editorial}>{DICTIONARY.editorialNote}</p>

      <section aria-labelledby="element-glance" className={styles.box}>
        <h2 id="element-glance">한눈에 보기</h2>
        <dl className={styles.meta}>
          <div><dt>계절 · 방향</dt><dd>{facts.season} · {facts.direction}</dd></div>
          <div><dt>색</dt><dd>{entry.color}</dd></div>
          <div><dt>천간</dt><dd>{facts.stems.map((glyph) => `${glyph.korean}(${glyph.hanja})`).join(" · ")}</dd></div>
          <div><dt>지지</dt><dd>{facts.branches.map((glyph) => `${glyph.korean}(${glyph.hanja})`).join(" · ")}</dd></div>
          <div><dt>상생</dt><dd>{named(facts.generatedBy)}{subject(named(facts.generatedBy))} {name}{object(name)} 낳고, {name}{subject(name)} {named(facts.generates)}{object(named(facts.generates))} 낳음</dd></div>
          <div><dt>상극</dt><dd>{name}{subject(name)} {named(facts.controls)}{object(named(facts.controls))} 누르고, {named(facts.controlledBy)}{subject(named(facts.controlledBy))} {name}{object(name)} 누름</dd></div>
        </dl>
      </section>

      <NumberedSections sections={sections} />

      <DetailFooter
        browse={{
          title: "오행 다섯 가지",
          items: ELEMENT_SLUGS.map((slug) => ({ label: ELEMENT_NAMES[slug], href: elementPath(slug), current: slug === entry.slug })),
        }}
        related={[
          ...entry.related.map((slug) => ({ label: `오행 ${ELEMENT_NAMES[slug]}`, href: elementPath(slug) })),
          { label: "사주 개념 사전 전체", href: DICTIONARY_PATH },
        ]}
      />
    </article>
  );
}
