import Link from "next/link";
import { HeroQuestionRotator } from "@/components/hero-question-rotator";

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
    copy: "AI가 정리한 리딩을 읽고 완료한 기록을 다시 확인합니다.",
  },
];

export default function HomePage() {
  return (
    <div className="landing-page">
      <section className="landing-hero page-width" aria-labelledby="landing-title">
        <div className="hero-copy">
          <p className="eyebrow">AI TAROT · SAJU</p>
          <h1 id="landing-title">
            지금,
            <br />
            뭐가 궁금하세요?
          </h1>
          <HeroQuestionRotator />
          <p className="hero-description">
            어떤 질문이든, 카드와 사주로 함께 답을 찾아볼게요.
          </p>
          <div className="hero-actions">
            <Link href="/tarot" className="primary-button cta-tarot">
              타로로 시작
            </Link>
            <Link href="/saju" className="secondary-button cta-saju">
              사주로 시작
            </Link>
          </div>
        </div>
      </section>

      <section className="reading-picks page-width" aria-labelledby="reading-picks-title">
        <h2 className="sr-only" id="reading-picks-title">
          왜 둘 다 보나요?
        </h2>
        <div className="picks-grid">
          <div className="pick-row">
            <span className="pick-dot pick-dot-tarot" aria-hidden="true" />
            <div>
              <strong>타로는 지금을 봐요</strong>
              <span>이번 주, 이번 달. 눈앞의 선택에 답을 줘요.</span>
            </div>
          </div>
          <div className="pick-row">
            <span className="pick-dot pick-dot-saju" aria-hidden="true" />
            <div>
              <strong>사주는 흐름을 봐요</strong>
              <span>타고난 결과 올해의 큰 방향. 멀리서 지도를 보는 쪽이에요.</span>
            </div>
          </div>
        </div>
      </section>

      <section className="reading-choice page-width" aria-labelledby="reading-choice-title">
        <div className="section-heading">
          <p className="eyebrow">CHOOSE YOUR PATH</p>
          <h2 id="reading-choice-title">지금 무엇을 살펴보고 싶나요?</h2>
        </div>
        <div className="choice-grid">
          <article className="reading-card tarot-card">
            <p className="card-kicker">INTUITIVE READING</p>
            <h3>마음의 질문, AI 타로</h3>
            <p>
              카드를 직접 고르고 지금 가장 궁금한 마음과 선택을 차분히
              들여다보세요.
            </p>
            <ul>
              <li>목적에 맞는 1장 · 3장 · 5장 리딩</li>
              <li>카드를 직접 고르고 단계별로 확인</li>
            </ul>
            <Link href="/tarot" className="primary-button" aria-label="타로 리딩 시작">
              타로 리딩 시작 <span aria-hidden="true">→</span>
            </Link>
          </article>
          <article className="reading-card saju-card">
            <p className="card-kicker">LIFE RHYTHM</p>
            <h3>삶의 흐름, AI 사주</h3>
            <p>
              생년월일시를 바탕으로 타고난 성향과 지금 이어지는 삶의 흐름을
              살펴보세요.
            </p>
            <ul>
              <li>양력 기준 근사 베타 리딩</li>
              <li>어려운 용어를 줄인 쉬운 해설</li>
            </ul>
            <Link href="/saju" className="secondary-button" aria-label="사주 리딩 시작">
              사주 리딩 시작 <span aria-hidden="true">→</span>
            </Link>
          </article>
        </div>
      </section>

      {/* Static illustrative sample, not a real reading — labeled as such below. */}
      <section className="reading-peek page-width" aria-labelledby="reading-peek-title">
        <h2 className="sr-only" id="reading-peek-title">
          리딩 예시
        </h2>
        <div className="reading-peek-card">
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

      <section className="how-it-works page-width" aria-labelledby="how-it-works-title">
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
      </section>
    </div>
  );
}
