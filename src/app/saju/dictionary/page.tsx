import Link from "next/link";

import { ElementCycle, JudgeTable, Paragraphs, styles } from "@/components/saju-dictionary/dictionary-parts";
import {
  DICTIONARY,
  DICTIONARY_PATH,
  ELEMENT_ENTRIES,
  TEN_GODS,
  TEN_GOD_GROUPS,
  elementFacts,
  elementPath,
  groupOf,
  samePolarity,
  tenGodPath,
} from "@/domain/saju-dictionary";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

const TITLE = "사주 개념 사전";

export const metadata = publicPageMetadata(
  DICTIONARY_PATH,
  `${TITLE}: 십성과 오행 뜻 정리 | 명로`,
  "만세력에 나오는 십성 열 가지와 오행 다섯 가지가 무엇을 뜻하고 어떻게 정해지는지 판정표와 함께 정리했어요.",
  generatedShareImage(DICTIONARY_PATH, TITLE),
);

export default function SajuDictionaryPage() {
  const hub = DICTIONARY.hub;
  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <p className="eyebrow" style={{ margin: "0 0 10px" }}>{TITLE}</p>
      <h1>{hub.title}</h1>
      <p className="flow-lead">{hub.description}</p>

      <section aria-labelledby="dictionary-judge" className={styles.section}>
        <h2 id="dictionary-judge">십성은 이렇게 정해집니다</h2>
        <Paragraphs items={hub.tenGodsLead} />
        <JudgeTable />
        <p className={styles.caption}>표의 이름을 누르면 그 십성 설명으로 이동해요.</p>
      </section>

      <section aria-labelledby="dictionary-cycle" className={styles.section}>
        <h2 id="dictionary-cycle">오행은 서로 낳고 누릅니다</h2>
        <Paragraphs items={hub.elementsLead} />
        <ElementCycle />
      </section>

      <section aria-labelledby="dictionary-ten-gods" className={styles.section}>
        <h2 id="dictionary-ten-gods">십성 열 가지</h2>
        {TEN_GOD_GROUPS.map((group) => (
          <div key={group.name}>
            <h3 className={styles.groupHead}>{group.name} · {group.gloss}</h3>
            <ul className={styles.grid}>
              {TEN_GODS.filter((entry) => groupOf(entry.slug) === group).map((entry) => (
                <li key={entry.slug}>
                  <Link href={tenGodPath(entry.slug)}>
                    <span className={styles.gridName}>{entry.name}<small lang="zh-Hant">{entry.hanja}</small></span>
                    <span className={styles.gridDesc}>{group.relation}, 음양이 {samePolarity(entry.slug) ? "같음" : "다름"}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-labelledby="dictionary-elements" className={styles.section} style={{ borderBottom: 0 }}>
        <h2 id="dictionary-elements">오행 다섯 가지</h2>
        <ul className={`${styles.grid} ${styles.five}`}>
          {ELEMENT_ENTRIES.map((entry) => {
            const facts = elementFacts(entry.slug);
            return (
              <li key={entry.slug}>
                <Link aria-label={`${facts.name}(${entry.hanja}) · ${facts.season} · ${facts.direction}`} href={elementPath(entry.slug)}>
                  <span aria-hidden="true" className={`${styles.glyph} ${styles[entry.slug]}`}>{entry.hanja}</span>
                  <span className={styles.gridName}>{facts.name}</span>
                  <span className={styles.gridDesc}>{facts.season} · {facts.direction}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <div className={styles.ctas}>
        <Link className="primary-button" href="/manseryeok">무료 만세력으로 내 명식 보기</Link>
      </div>
      <p className={styles.disclaimer}>{DICTIONARY.disclaimer}</p>
    </article>
  );
}
