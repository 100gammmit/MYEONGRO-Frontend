import Link from "next/link";
import { notFound } from "next/navigation";

import {
  Breadcrumbs,
  DetailFooter,
  GlyphText,
  JudgeTable,
  NumberedSections,
  Paragraphs,
  styles,
} from "@/components/saju-dictionary/dictionary-parts";
import {
  DICTIONARY_PATH,
  TEN_GOD_NAMES,
  TEN_GOD_SLUGS,
  getTenGod,
  isPolite,
  topic,
  withAnd,
  groupOf,
  pairOf,
  samePolarity,
  tenGodByDayStem,
  tenGodExample,
  tenGodPath,
} from "@/domain/saju-dictionary";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return TEN_GOD_SLUGS.map((slug) => ({ slug }));
}

interface TenGodPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: TenGodPageProps) {
  const entry = getTenGod((await params).slug);
  if (!entry) return {};
  const path = tenGodPath(entry.slug);
  const title = `${entry.name}(${entry.hanja}) 뜻`;
  return publicPageMetadata(path, `${title}: 사주 개념 사전 | 명로`, entry.lead, generatedShareImage(path, title));
}

export default async function TenGodPage({ params }: TenGodPageProps) {
  const entry = getTenGod((await params).slug);
  if (!entry) notFound();

  const group = groupOf(entry.slug);
  const pair = pairOf(entry.slug);
  const example = tenGodExample(entry.slug, entry.exampleDayStem);
  const byDay = tenGodByDayStem(entry.slug);

  const sections = [
    {
      id: "principle",
      title: `${entry.name}${topic(entry.name)} 이렇게 정해집니다`,
      body: (
        <>
          <Paragraphs items={entry.principle} />
          <JudgeTable current={entry.slug} />
          <p className={styles.caption}>금색 칸이 {entry.name}, 보라 테두리가 짝인 {TEN_GOD_NAMES[pair]}{isPolite(TEN_GOD_NAMES[pair])}.</p>
          <ul aria-label={`${example.dayStem.korean}(${example.dayStem.hanja}) 일간의 예`} className={styles.example}>
            <li><span className={styles.glyph}><GlyphText glyph={example.dayStem} /></span>일간</li>
            <li className={styles.hit}><span className={styles.glyph}><GlyphText glyph={example.stem} /></span>천간 {entry.name}</li>
            {example.branches.map((branch) => (
              <li className={styles.hit} key={branch.hanja}><span className={styles.glyph}><GlyphText glyph={branch} /></span>지지 {entry.name}</li>
            ))}
          </ul>
        </>
      ),
    },
    { id: "meaning", title: "전통적으로 읽는 의미", body: <Paragraphs items={entry.meaning} /> },
    { id: "timing", title: "원국에서 볼 때와 운에서 만날 때", body: <Paragraphs items={entry.timing} /> },
    { id: "flow", title: "다른 십성과의 관계", body: <Paragraphs items={entry.flow} /> },
    {
      id: "myths",
      title: "흔한 오해 바로잡기",
      body: (
        <dl className={styles.myths}>
          {entry.myths.map((myth) => (
            <div key={myth.claim}>
              <dt><span className={styles.mythLabel}>오해</span>{myth.claim}</dt>
              <dd>{myth.answer}</dd>
            </div>
          ))}
        </dl>
      ),
    },
    {
      id: "pair",
      title: `${TEN_GOD_NAMES[pair]}${withAnd(TEN_GOD_NAMES[pair])} 무엇이 다른가요`,
      body: (
        <>
          <Paragraphs items={entry.pair} />
          <p className={styles.callout}>
            <strong>짝 십성</strong>
            {TEN_GOD_NAMES[pair]} · {group.relation} 가운데 일간과 음양이 {samePolarity(pair) ? "같은" : "다른"} 글자예요.{" "}
            <Link href={tenGodPath(pair)}>{TEN_GOD_NAMES[pair]} 읽기</Link>
          </p>
        </>
      ),
    },
    {
      id: "find",
      title: "만세력에서 찾는 법",
      body: (
        <>
          <Paragraphs items={entry.find} />
          <table className={styles.byDay}>
            <caption className={styles.caption} style={{ captionSide: "bottom", textAlign: "left" }}>
              지지는 그 지지의 주된 기운(지장간 본기)으로 계산해요.
            </caption>
            <thead><tr><th scope="col">일간</th><th scope="col">천간 {entry.name}</th><th scope="col">지지 {entry.name}</th></tr></thead>
            <tbody>
              {byDay.map((row) => (
                <tr key={row.dayStem.hanja}>
                  <th className={styles.glyphCell} scope="row"><GlyphText glyph={row.dayStem} /> <span className={styles.caption}>{row.dayStem.korean}</span></th>
                  <td className={styles.glyphCell}><GlyphText glyph={row.stem} /> <span className={styles.caption}>{row.stem.korean}</span></td>
                  <td className={styles.glyphCell}>
                    {row.branches.map((branch, index) => (
                      <span key={branch.hanja}>{index ? " · " : ""}<GlyphText glyph={branch} /> <span className={styles.caption}>{branch.korean}</span></span>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      ),
    },
  ];

  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <Breadcrumbs trail={[{ label: "십성", href: `${DICTIONARY_PATH}#dictionary-ten-gods` }, { label: entry.name }]} />
      <h1>{entry.name}{" "}<span className={styles.han} lang="zh-Hant">{entry.hanja}</span></h1>
      <p className="flow-lead">{entry.lead}</p>

      <section aria-labelledby="ten-god-glance" className={styles.box}>
        <h2 id="ten-god-glance">한눈에 보기</h2>
        <dl className={styles.meta}>
          <div><dt>묶음</dt><dd>{group.name} · {group.gloss}</dd></div>
          <div><dt>일간과의 관계</dt><dd>{group.relation}</dd></div>
          <div><dt>음양</dt><dd>일간과 {samePolarity(entry.slug) ? "같음" : "다름"}</dd></div>
          <div><dt>짝 십성</dt><dd><Link href={tenGodPath(pair)}>{TEN_GOD_NAMES[pair]}</Link></dd></div>
        </dl>
      </section>

      <NumberedSections sections={sections} />

      <DetailFooter
        browse={{
          title: "십성 열 가지",
          items: TEN_GOD_SLUGS.map((slug) => ({ label: TEN_GOD_NAMES[slug], href: tenGodPath(slug), current: slug === entry.slug })),
        }}
        related={[
          ...entry.related.map((slug) => ({ label: TEN_GOD_NAMES[slug], href: tenGodPath(slug) })),
          { label: "사주 개념 사전 전체", href: DICTIONARY_PATH },
        ]}
      />
    </article>
  );
}
