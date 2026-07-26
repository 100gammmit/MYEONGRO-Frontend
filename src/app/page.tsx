import Link from "next/link";

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
            지금의 마음을
            <br />
            별빛 아래 펼쳐보세요
          </h1>
          <p className="hero-description">
            질문 하나와 생년월일시로 시작하는 조용한 리딩. 복잡한 마음을
            천천히 바라볼 수 있도록 명로가 곁에서 해석합니다.
          </p>
          <div className="hero-actions">
            <Link href="/tarot" className="primary-button">
              타로로 시작
            </Link>
            <Link href="/saju" className="secondary-button">
              사주로 시작
            </Link>
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

        <div className="landing-trust" aria-label="서비스 이용 안내">
          <span>소셜 로그인 후 시작</span>
          <span>완료한 리딩 기록 저장</span>
          <span>선택을 돕는 성찰형 해석</span>
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
