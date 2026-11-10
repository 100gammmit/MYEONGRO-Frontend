import { publicPageMetadata } from "@/infrastructure/site-metadata";
import Image from "next/image";
import Link from "next/link";
import { HomeSajuChart } from "@/components/home-saju-chart";
import { ReadingHelpEntry } from "@/components/reading-help-links";
import { TarotCardCaption, tarotCardImageSrc } from "@/components/tarot-card-face";
import { TarotStone } from "@/components/tarot-stone";

export const metadata = publicPageMetadata(
  "/",
  "명로 | AI 사주와 타로",
  "오늘의 운세는 로그인 없이 카드 한 장으로, 연애·일·인간관계 같은 고민은 무료 AI 타로·사주로 풀어 보세요.",
);

// Every id below is a fixed major arcana card, so the lookup always returns a path.
function cardSrc(cardId: string): string {
  return tarotCardImageSrc(cardId) ?? "";
}

const features = [
  {
    number: "01",
    title: "질문을 남겨요",
    copy: "지금 마음에 머무는 질문을 한 문장으로 적습니다.",
  },
  {
    number: "02",
    title: "카드 또는 정보를 선택해요",
    copy: "타로 카드를 고르거나 생년월일시를 입력합니다.",
  },
  {
    number: "03",
    title: "나만의 해석을 읽어요",
    copy: "해석을 읽고, 완료한 리딩은 기록에서 다시 확인합니다.",
  },
] as const;

function FeatureVisual({ number }: { number: (typeof features)[number]["number"] }) {
  if (number === "01") {
    return (
      <span className="home-step-question">
        <span>“</span>요즘 왜 이렇게 지칠까요?<span>”</span>
      </span>
    );
  }
  if (number === "02") {
    return (
      <>
        <span className="home-step-card tarot-back-art" />
        <HomeSajuChart size="mini" />
      </>
    );
  }
  return (
    <>
      <Image
        alt=""
        className="home-step-card"
        height={773}
        src={cardSrc("major-18-moon")}
        unoptimized
        width={480}
      />
      <span className="home-step-note">
        <strong>흐릿해진 방향감</strong>
        <span>달의 희미한 빛처럼, 작은 불안이 실제보다 크게 느껴질 수 있어요.</span>
      </span>
    </>
  );
}

export default function HomePage() {
  return (
    <div className="landing-page">
      <section className="landing-hero page-width" aria-labelledby="landing-title">
        <div className="hero-head">
          <h1 id="landing-title">
            지금,{" "}
            <br className="hero-title-break" />
            뭐가 궁금하세요?
          </h1>
          <p className="hero-description">
            AI 타로와 사주로 마음에 머무는 질문을 풀어요. 오늘의 운세는 로그인 없이 무료예요.
          </p>
        </div>
        {/* Both starts share one gold fill; filling only one would crown it the main path. */}
        <div className="hero-split">
          <div className="hero-path tarot-path">
            <div className="hero-path-copy">
              <h2>AI 타로</h2>
              <p>카드의 자리로 가까운 고민의 지금과 다음 전개를 읽어요.</p>
              <ul>
                <li>로그인 없이 보는 무료 오늘의 운세</li>
                <li>질문과 함께 진행하는 AI 3장·5장 리딩</li>
              </ul>
            </div>
            <span aria-hidden="true" className="hero-fan">
              <span className="hero-fan-back tarot-back-art" />
              <Image
                alt=""
                className="hero-fan-front"
                height={773}
                priority
                src={cardSrc("major-00-fool")}
                unoptimized
                width={480}
              />
            </span>
            <Link href="/tarot" className="primary-button">
              타로로 시작
            </Link>
          </div>
          <div className="hero-path saju-path">
            <div className="hero-path-copy">
              <h2>AI 사주</h2>
              <p>명식을 먼저 계산해 타고난 성향과 한 해의 흐름을 읽어요.</p>
              <ul>
                <li>현재 양력 생일만 지원</li>
                <li>출생 시각의 정확도에 맞춘 해석</li>
              </ul>
            </div>
            <HomeSajuChart size="hero" />
            <Link href="/saju" className="primary-button">
              사주로 시작
            </Link>
          </div>
        </div>
      </section>

      <section className="daily-band" aria-labelledby="daily-band-title">
        <div className="daily-band-row page-width">
          <span className="daily-band-card tarot-back-art" aria-hidden="true">
            <TarotStone kind="pearl" />
          </span>
          <div>
            <h2 id="daily-band-title">오늘의 운세는 로그인 없이 무료예요</h2>
            <p>카드 한 장으로 오늘의 흐름을 살펴보세요.</p>
          </div>
          <Link href="/tarot/daily" className="outline-cta">
            오늘의 운세 보기
          </Link>
        </div>
      </section>

      {/* A line from a preview reading made with the active tarot prompts, quoted as written. */}
      <section className="reading-peek page-width" aria-labelledby="reading-peek-title">
        <h2 className="sr-only" id="reading-peek-title">
          리딩 예시
        </h2>
        <Image
          alt=""
          className="reading-peek-card"
          height={773}
          src={cardSrc("major-21-world")}
          unoptimized
          width={480}
        />
        <TarotCardCaption cardId="major-21-world" name="세계" className="reading-peek-name" />
        <p className="reading-peek-label" aria-hidden="true">
          리딩 예시
        </p>
        <blockquote>
          <span aria-hidden="true">“</span>세계는 지금 관계가 멀어지는 쪽보다, 예전과 달라진
          방식으로 이어지는 쪽에 가깝다고 읽혀요.<span aria-hidden="true">”</span>
        </blockquote>
        <p className="reading-peek-from">관계 리딩, 관계의 흐름 자리 해석 중에서</p>
      </section>

      <section className="how-it-works page-width" aria-labelledby="how-it-works-title">
        <h2 id="how-it-works-title">세 단계로 만나는 나의 리딩</h2>
        <ol className="feature-row">
          {features.map((feature) => (
            <li className="feature" key={feature.number}>
              <div aria-hidden="true" className="feature-visual">
                <FeatureVisual number={feature.number} />
              </div>
              <span>{feature.number}</span>
              <h3>{feature.title}</h3>
              <p>{feature.copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="reading-method-entry page-width" aria-labelledby="reading-method-entry-title">
        <div>
          <h2 id="reading-method-entry-title">그냥 AI에게 물어보는 것과 무엇이 다를까요?</h2>
          <p>
            명로는 질문을 바로 AI에 맡기지 않아요. 타로는 카드의 자리를 정하고,
            사주는 명식을 먼저 계산한 뒤 해석해요.
          </p>
        </div>
        <Link href="/about#reading-method" className="outline-cta">
          명로의 리딩 방식 보기
        </Link>
      </section>

      <ReadingHelpEntry />
      <section className="landing-closing page-width" aria-labelledby="landing-closing-title">
        <h2 id="landing-closing-title">오늘은 어떤 마음인가요?</h2>
        <Link href="/tarot/daily" className="primary-button closing-cta">
          무료로 오늘의 운세 보기
        </Link>
      </section>
    </div>
  );
}
