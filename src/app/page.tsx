import Link from "next/link";
import { HeroQuestionRotator } from "@/components/hero-question-rotator";
import { LandingSky } from "@/components/landing-sky";

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
    copy: "AI 타로·사주는 해석을 읽고 완료한 기록을 다시 확인합니다.",
  },
];

export default function HomePage() {
  return (
    <div className="landing-page">
      <div className="landing-top">
        <LandingSky />
        <section className="landing-hero page-width" aria-labelledby="landing-title">
          <div className="hero-copy">
            <p className="eyebrow">AI TAROT · SAJU</p>
            <h1 id="landing-title">
              지금,{" "}
              <br className="hero-title-break" />
              뭐가 궁금하세요?
            </h1>
            <HeroQuestionRotator />
            <p className="hero-description">
              마음에 머무는 질문을 카드와 사주로 차분히 풀어볼게요.
            </p>
          </div>
          {/* Both starts share one gold fill; filling only one would crown it the main path. */}
          <div className="hero-actions">
            <Link href="/tarot" className="primary-button">
              타로로 시작
            </Link>
            <Link href="/saju" className="primary-button">
              사주로 시작
            </Link>
          </div>
        </section>
      </div>

      <section className="daily-band" aria-labelledby="daily-band-title">
        <div className="daily-band-row page-width">
          <span className="daily-band-card" aria-hidden="true">✦</span>
          <div>
            <h2 id="daily-band-title">오늘의 운세는 로그인 없이 무료예요</h2>
            <p>카드 한 장으로 오늘의 흐름을 가볍게 살펴보세요.</p>
          </div>
          <Link href="/tarot/daily" className="outline-cta">
            오늘의 운세 보기 <span aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* Static illustrative sample, not a real reading — labeled as such below. */}
      <section className="reading-peek page-width" aria-labelledby="reading-peek-title">
        <h2 className="sr-only" id="reading-peek-title">
          리딩 예시
        </h2>
        <div className="reading-peek-card">
          <span className="reading-peek-seal" aria-hidden="true" />
          <p className="reading-peek-label" aria-hidden="true">
            리딩 예시
          </p>
          <blockquote>
            이 시기의 당신은 무언가를 끝내는 중이에요. 끝내는 일은 잃는 일과
            달라요.
          </blockquote>
          <p className="reading-peek-from">3장 리딩 · 현재 자리 해석 중에서</p>
        </div>
      </section>

      <section className="reading-choice page-width" aria-labelledby="reading-choice-title">
        <div className="landing-column">
          <div className="section-heading">
            <h2 id="reading-choice-title">지금 무엇을 살펴보고 싶나요?</h2>
            <p>타로는 지금을, 사주는 흐름을 봅니다.</p>
          </div>
          <div className="choice-grid">
            <article className="reading-card tarot-card">
              <p className="card-kicker">INTUITIVE READING</p>
              <h3>오늘의 운세와 AI 타로</h3>
              <p>이번 주나 이번 달처럼 가까운 고민에 생각할 실마리를 건네요.</p>
              <ul>
                <li>로그인 없이 보는 무료 오늘의 운세</li>
                <li>질문과 함께 진행하는 AI 3장 · 5장 리딩</li>
              </ul>
              <Link href="/tarot" className="outline-cta" aria-label="타로 리딩 시작">
                타로 리딩 시작 <span aria-hidden="true">→</span>
              </Link>
            </article>
            <article className="reading-card saju-card">
              <p className="card-kicker">LIFE RHYTHM</p>
              <h3>삶의 흐름, AI 사주</h3>
              <p>타고난 성향과 올해의 큰 흐름을 넓게 살펴봐요.</p>
              <ul>
                <li>현재 양력 생일만 지원</li>
                <li>출생 시각의 정확도에 맞춘 해석</li>
              </ul>
              <Link href="/saju" className="outline-cta" aria-label="사주 리딩 시작">
                사주 리딩 시작 <span aria-hidden="true">→</span>
              </Link>
            </article>
          </div>
        </div>
      </section>

      <section className="how-it-works page-width" aria-labelledby="how-it-works-title">
        <div className="landing-column">
          <div className="section-heading">
            <p className="eyebrow">HOW IT WORKS</p>
            <h2 id="how-it-works-title">세 단계로 만나는 나의 리딩</h2>
          </div>
          <div className="feature-row">
            {features.map((feature) => (
              <div className="feature" key={feature.number}>
                <span>{feature.number}</span>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-closing" aria-labelledby="landing-closing-title">
        <div className="page-width">
          <h2 id="landing-closing-title">오늘은 어떤 마음인가요?</h2>
          <Link href="/tarot/daily" className="primary-button closing-cta">
            무료로 오늘의 운세 보기
          </Link>
        </div>
      </section>
    </div>
  );
}
