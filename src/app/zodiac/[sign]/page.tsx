import Link from "next/link";
import { notFound } from "next/navigation";

import { Chevron, ZodiacNav, ZodiacYears } from "@/components/zodiac/zodiac-parts";
import { ZodiacWheel } from "@/components/zodiac/zodiac-wheel";
import styles from "@/components/zodiac/zodiac.module.css";
import {
  ZODIAC_SIGNS,
  ZODIAC_SLUGS,
  ZODIAC_YEAR_CONTENT as YEAR,
  getZodiacSign,
  type ZodiacSign,
} from "@/domain/zodiac-fortune";
import { publicPageMetadata } from "@/infrastructure/site-metadata";

export const dynamicParams = false;

export function generateStaticParams() {
  return ZODIAC_SLUGS.map((sign) => ({ sign }));
}

interface ZodiacSignPageProps {
  params: Promise<{ sign: string }>;
}

const YEAR_NAME = ZODIAC_SIGNS.find((sign) => sign.slug === YEAR.yearAnimal)?.shortName ?? "";

// The page title reuses the one-line summary without its sentence ending ("…해예요." → "…해").
function headline(sign: ZodiacSign): string {
  return sign.summary.replace(/(예요)?\.$/, "");
}

// 범띠 is also searched as 호랑이띠; only the description carries that name.
function description(sign: ZodiacSign): string {
  return sign.slug === "tiger" ? `범띠(호랑이띠): ${sign.summary}` : sign.summary;
}

export async function generateMetadata({ params }: ZodiacSignPageProps) {
  const sign = getZodiacSign((await params).sign);
  if (!sign) return {};
  const path = `/zodiac/${sign.slug}`;
  const title = `${YEAR.year} ${sign.name} 신년운세`;
  return publicPageMetadata(path, `${title} | 명로`, description(sign), {
    url: `${path}/opengraph-image`,
    width: 1200,
    height: 630,
    alt: title,
  });
}

export default async function ZodiacSignPage({ params }: ZodiacSignPageProps) {
  const sign = getZodiacSign((await params).sign);
  if (!sign) notFound();

  const sections = [
    { id: "work", title: "일과 생활", body: sign.work },
    { id: "relationship", title: "관계", body: sign.relationship },
    { id: "money", title: "돈", body: sign.money },
    { id: "body", title: "몸의 리듬", body: sign.body },
  ];

  return (
    <article className={`flow-page page-width ${styles.page}`}>
      <Link className={styles.back} href="/zodiac"><span aria-hidden="true">←</span> 띠별 신년운세</Link>
      <ZodiacNav current={sign.slug} />
      <h1>{YEAR.year} {sign.name} 신년운세: {headline(sign)}</h1>
      <p className="flow-lead">
        {YEAR.year}년 {YEAR_NAME}의 해에 {sign.name}가 읽어 볼 만한 이야기를 일과 생활, 관계, 돈, 몸의 리듬으로 나눠 풀었어요.
      </p>
      <p className={styles.editorial}>{YEAR.editorialNote}</p>

      <section aria-labelledby="sign-summary" className={styles.box}>
        <h2 id="sign-summary">한 줄 요약</h2>
        <p className={styles.boxLead}>{sign.summary}</p>
        <p className={styles.boxSub}><strong>{YEAR.year}년은 어떤 해</strong>{YEAR.intro}</p>
      </section>

      <section aria-labelledby="sign-years" className={styles.section}>
        <h2 id="sign-years">{sign.name} 출생연도</h2>
        <ZodiacYears name={sign.name} slug={sign.slug} year={YEAR.year} />
        <p>{YEAR.ipchunNote}</p>
        <Link className={styles.inlineLink} href="/zodiac#finder">내 띠가 맞는지 확인하기 <Chevron /></Link>
      </section>

      <section aria-labelledby="sign-basis" className={styles.section}>
        <h2 id="sign-basis">올해의 근거</h2>
        <div className={styles.signWheel}>
          <ZodiacWheel focus={sign.slug} yearAnimal={YEAR.yearAnimal} yearLabel={`${YEAR_NAME}의 해`} yearNumber={YEAR.year} />
        </div>
        <p>{sign.basis}</p>
      </section>

      {sections.map((section) => (
        <section aria-labelledby={`sign-${section.id}`} className={styles.section} key={section.id}>
          <h2 id={`sign-${section.id}`}>{section.title}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <section aria-labelledby="sign-common" className={styles.section}>
        <h2 id="sign-common">같은 띠 공통 글 안내</h2>
        <p>{YEAR.commonNote}</p>
      </section>

      <section aria-labelledby="sign-related" className={styles.related}>
        <h2 id="sign-related">함께 확인하면 좋은 안내</h2>
        <div className={styles.links}>
          <Link href="/zodiac">{YEAR.year}년 띠별 신년운세 전체</Link>
          <Link href="/guide/saju/annual-report">한 해 사주 리포트 읽는 법</Link>
        </div>
      </section>
      <Link className={`primary-button ${styles.start}`} href="/saju?report=annual">사주 한 해 리포트 보기</Link>
      <p className={styles.disclaimer}>{YEAR.disclaimer}</p>
    </article>
  );
}
