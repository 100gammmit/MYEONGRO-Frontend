import Link from "next/link";

import { styles } from "@/components/saju-dictionary/dictionary-parts";
import {
  BASICS,
  BASICS_PATH,
  DICTIONARY,
  DICTIONARY_PATH,
  ELEMENT_ENTRIES,
  STEM_SLUGS,
  TEN_GODS,
  TEN_GOD_GROUPS,
  elementFacts,
  elementPath,
  groupOf,
  stemFacts,
  stemPath,
  tenGodPath,
} from "@/domain/saju-dictionary";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

const TITLE = "사주 개념 사전";

export const metadata = publicPageMetadata(
  DICTIONARY_PATH,
  `${TITLE}: 십성과 오행 뜻 찾아보기 | 명로`,
  "만세력에 나오는 사주 용어를 기초 개념부터 십성 열 가지, 오행 다섯 가지, 천간 열 글자까지 한 페이지에서 찾아볼 수 있어요.",
  generatedShareImage(DICTIONARY_PATH, TITLE),
);

/** The first page only points the way: basics first, then every entry by group, all within a screen or two. */
export default function SajuDictionaryPage() {
  return (
    <article className={`flow-page page-width ${styles.page} ${styles.guide}`}>
      <p className="eyebrow" style={{ margin: "0 0 10px" }}>{TITLE}</p>
      <h1>{DICTIONARY.hub.title}</h1>
      <p className={styles.guideLead}>{DICTIONARY.hub.description}</p>

      <section aria-labelledby="dictionary-basics" className={styles.guideSection}>
        <div className={styles.guideHead}>
          <h2 id="dictionary-basics">기초 개념</h2>
          <Link href={BASICS_PATH}>기초 전체 읽기 →</Link>
        </div>
        <ol className={styles.guideBasics}>
          {BASICS.steps.map((step, index) => (
            <li key={step.id}>
              <Link href={`${BASICS_PATH}#${step.id}`}><span aria-hidden="true" className={styles.guideNumber}>{index + 1}</span>{step.title}</Link>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="dictionary-ten-gods" className={styles.guideSection}>
        <div className={styles.guideHead}>
          <h2 id="dictionary-ten-gods">십성</h2>
          <span>일간과 다른 글자의 관계</span>
        </div>
        <ul className={styles.guideTen}>
          {TEN_GOD_GROUPS.map((group) => (
            <li key={group.name}>
              <span className={styles.guideGroup}><b>{group.name}</b><small>{group.gloss}</small></span>
              {TEN_GODS.filter((entry) => groupOf(entry.slug) === group).map((entry) => (
                <Link href={tenGodPath(entry.slug)} key={entry.slug}>{entry.name}<small lang="zh-Hant">{entry.hanja}</small></Link>
              ))}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dictionary-elements" className={styles.guideSection}>
        <div className={styles.guideHead}>
          <h2 id="dictionary-elements">오행</h2>
          <span>목·화·토·금·수 다섯 기운</span>
        </div>
        <ul className={styles.guideFive}>
          {ELEMENT_ENTRIES.map((entry) => (
            <li key={entry.slug}>
              <Link href={elementPath(entry.slug)}>
                <span aria-hidden="true" className={`${styles.glyph} ${styles[entry.slug]}`}>{entry.hanja}</span>
                {elementFacts(entry.slug).name}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="dictionary-stems" className={styles.guideSection}>
        <div className={styles.guideHead}>
          <h2 id="dictionary-stems">천간</h2>
          <span>명식의 위 글자 열 개</span>
        </div>
        <ul className={styles.guideStems}>
          {STEM_SLUGS.map((slug) => {
            const { glyph } = stemFacts(slug);
            return (
              <li key={slug}>
                <Link href={stemPath(slug)}>
                  <span aria-hidden="true" className={`${styles.glyph} ${styles[glyph.element]}`}>{glyph.hanja}</span>
                  {glyph.korean}
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className={styles.guideFoot}>
        <Link className="primary-button" href="/manseryeok">무료 만세력으로 내 명식 보기</Link>
        <p className={styles.disclaimer}>{DICTIONARY.editorialNote} {DICTIONARY.disclaimer}</p>
      </div>
    </article>
  );
}
