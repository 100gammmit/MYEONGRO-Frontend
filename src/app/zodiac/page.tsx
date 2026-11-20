import Link from "next/link";

import { ZodiacFinder } from "@/components/zodiac/zodiac-finder";
import { ZodiacCards, ZodiacLegend } from "@/components/zodiac/zodiac-parts";
import { ZodiacWheel } from "@/components/zodiac/zodiac-wheel";
import styles from "@/components/zodiac/zodiac.module.css";
import { ZODIAC_SIGNS, ZODIAC_YEAR_ANIMAL_NAME as YEAR_NAME, ZODIAC_YEAR_CONTENT as YEAR, type ZodiacSlug } from "@/domain/zodiac-fortune";
import { generatedShareImage, publicPageMetadata } from "@/infrastructure/site-metadata";

export const metadata = publicPageMetadata(
  "/zodiac",
  `${YEAR.year} 띠별 신년운세: 열두 띠와 ${YEAR.yearName} | 명로`,
  YEAR.hub.description,
  generatedShareImage("/zodiac", `${YEAR.year} 띠별 신년운세`),
);

const SIGN_NAMES = Object.fromEntries(ZODIAC_SIGNS.map((sign) => [sign.slug, sign.name])) as Record<ZodiacSlug, string>;

export default function ZodiacHubPage() {
  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <h1>{YEAR.hub.title}</h1>
      <p className="flow-lead">{YEAR.hub.description}</p>
      <p className={styles.editorial}>{YEAR.editorialNote}</p>

      <section aria-labelledby="zodiac-summary" className={styles.box}>
        <h2 id="zodiac-summary">{YEAR.year}년 핵심 세 가지</h2>
        <ul>{YEAR.hub.summary.map((line) => <li key={line}>{line}</li>)}</ul>
      </section>

      <ZodiacFinder lastYear={YEAR.year} lead={YEAR.hub.finderLead} signNames={SIGN_NAMES} />

      <section aria-labelledby="zodiac-year" className={styles.section}>
        <h2 id="zodiac-year">{YEAR.yearName}은 어떤 해인가요</h2>
        <p>{YEAR.intro}</p>
        <p>{YEAR.hub.yearNote}</p>
      </section>

      <section aria-labelledby="zodiac-signs" className={styles.section}>
        <h2 id="zodiac-signs">열두 띠와 올해의 {YEAR_NAME}</h2>
        <p>{YEAR.hub.signsLead}</p>
        <div className={styles.signsBody}>
          <div className={styles.wheelWrap}>
            <ZodiacWheel yearAnimal={YEAR.yearAnimal} yearNumber={YEAR.year} />
            <ZodiacLegend />
          </div>
          <ZodiacCards year={YEAR.year} yearAnimal={YEAR.yearAnimal} />
        </div>
      </section>

      <section aria-labelledby="zodiac-limits" className={styles.section}>
        <h2 id="zodiac-limits">띠별 글을 읽는 법과 한계</h2>
        {YEAR.hub.limits.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
      </section>

      <section aria-labelledby="zodiac-related" className={styles.related}>
        <h2 id="zodiac-related">함께 확인하면 좋은 안내</h2>
        <div className={styles.links}>
          <Link href="/saju?report=annual">AI 사주 한 해 리포트</Link>
          <Link href="/guide/saju/annual-report">한 해 사주 리포트 읽는 법</Link>
          <Link href="/manseryeok">무료 만세력으로 내 명식 보기</Link>
        </div>
      </section>
      <Link className={`primary-button ${styles.start}`} href="/saju">사주 리딩 시작하기</Link>
      <p className={styles.disclaimer}>{YEAR.disclaimer}</p>
    </article>
  );
}
