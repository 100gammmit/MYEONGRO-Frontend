import Link from "next/link";

import {
  ZODIAC_SIGNS,
  ganjiName,
  pageBirthYears,
  relationTag,
  relationsWithYear,
  type ZodiacSlug,
} from "@/domain/zodiac-fortune";

import { GROUP_STYLES, RELATION_STROKES } from "./zodiac-wheel";
import styles from "./zodiac.module.css";

export function Chevron() {
  return (
    <svg aria-hidden="true" fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

function LineSwatch({ color, width, dash }: { color: string; width: number; dash?: string }) {
  return (
    <svg aria-hidden="true" height="12" viewBox="0 0 28 12" width="28">
      <line stroke={color} strokeDasharray={dash} strokeLinecap="round" strokeWidth={width} x1="2" x2="26" y1="6" y2="6" />
    </svg>
  );
}

/** What each line on the wheel means, in everyday words. 방합 and 파 are the runbook's minor relations. */
export function ZodiacLegend() {
  return (
    <div className={styles.legendWrap}>
      <ul className={styles.legend}>
        <li><LineSwatch {...RELATION_STROKES.sixHarmony} />육합: 손발이 잘 맞는 사이</li>
        <li>
          <svg aria-hidden="true" height="12" viewBox="0 0 28 12" width="28">
            <polygon fill={GROUP_STYLES.threeHarmony.fill} points="2,11 14,1 26,11" stroke={GROUP_STYLES.threeHarmony.stroke} strokeWidth="1.5" />
          </svg>
          삼합: 셋이 같은 방향으로 힘을 합치는 사이
        </li>
        <li><LineSwatch {...RELATION_STROKES.clash} />충: 멈춰 있던 것이 움직이는 사이</li>
        <li><LineSwatch color={GROUP_STYLES.punishment.stroke} dash={GROUP_STYLES.punishment.dash} width={GROUP_STYLES.punishment.width} />형: 규칙과 역할을 다시 맞춰 보는 사이</li>
        <li><LineSwatch {...RELATION_STROKES.resentHarm} />원진·해: 작은 서운함이 생기기 쉬운 사이</li>
      </ul>
      <p className={styles.legendMinor}>
        <LineSwatch color={GROUP_STYLES.seasonGroup.stroke} width={GROUP_STYLES.seasonGroup.width} />방합
        <LineSwatch {...RELATION_STROKES.breaking} />파는 보조로만 표시해요.
      </p>
    </div>
  );
}

/** Every sign as a linked card: its one-line summary and, when it has one, its relation to the year. */
export function ZodiacCards({ yearAnimal, year }: { yearAnimal: ZodiacSlug; year: number }) {
  return (
    <ul aria-label={`띠별 ${year}년 글`} className={styles.cards}>
      {ZODIAC_SIGNS.map((sign) => {
        const tag = relationTag(relationsWithYear(sign.slug, yearAnimal));
        return (
          <li className={sign.slug === yearAnimal ? styles.yearCard : undefined} key={sign.slug}>
            <Link href={`/zodiac/${sign.slug}`}>
              <span className={styles.cardHead}>
                <span className={styles.cardName}>{sign.name}</span>
                <Chevron />
              </span>
              <span className={styles.cardSummary}>{sign.summary}</span>
              {tag ? <span className={styles.cardTag}>{tag}</span> : null}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** A row of all twelve signs so a reader can jump between sign pages. */
export function ZodiacNav({ current }: { current: ZodiacSlug }) {
  return (
    <nav aria-label="띠별 운세" className={styles.nav}>
      {ZODIAC_SIGNS.map((sign) => (
        <Link aria-current={sign.slug === current ? "page" : undefined} href={`/zodiac/${sign.slug}`} key={sign.slug}>
          {sign.name}
        </Link>
      ))}
    </nav>
  );
}

/** Recent birth years of a sign with their sexagenary names. */
export function ZodiacYears({ slug, year, name }: { slug: ZodiacSlug; year: number; name: string }) {
  return (
    <ul aria-label={`${name} 출생연도`} className={styles.years}>
      {pageBirthYears(slug, year).map((birthYear) => (
        <li key={birthYear}>
          <strong>{birthYear}</strong>
          <span>{ganjiName(birthYear)}년</span>
        </li>
      ))}
    </ul>
  );
}
