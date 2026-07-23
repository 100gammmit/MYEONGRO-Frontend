import Link from "next/link";

const features = [
  {
    number: "01",
    title: "리딩 선택",
    copy: "오늘의 흐름, 마음, 관계, 선택 또는 사주 중 지금 필요한 리딩을 골라보세요.",
  },
  {
    number: "02",
    title: "나만의 입력",
    copy: "타로 카드를 직접 고르거나 생년월일시를 입력해 나만의 리딩을 시작해요.",
  },
  {
    number: "03",
    title: "현실적인 조언",
    copy: "결과를 단정하는 예언보다 지금 살펴볼 점과 실천할 행동을 확인해요.",
  },
];

export default function HomePage() {
  return (
    <>
      <section className="hero page-width">
        <div className="hero-copy">
          <h1>
            AI 타로/사주
          </h1>
          <p className="hero-description">
            타로 카드와 생년월일시를 바탕으로 지금의 마음, 관계와 선택을 차분히 살펴보세요.
          </p>
          <div className="trust-row">
            <span>로그인 후 리딩 시작</span>
            <span>완료한 리딩 기록 저장</span>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="moon"></div>
          <span className="star star-a">✦</span>
          <span className="star star-b">✧</span>
          <span className="star star-c">✦</span>
        </div>
      </section>

      <section className="reading-choice page-width">
        <div className="section-heading">
          <p className="eyebrow">CHOOSE YOUR PATH</p>
          <h2>지금 무엇을 살펴보고 싶나요?</h2>
        </div>
        <div className="choice-grid">
          <article className="reading-card tarot-card">
            <div className="card-symbol">☾</div>
            <p className="card-kicker">오늘의 흐름부터 중요한 선택까지</p>
            <h3>AI 타로</h3>
            <p>오늘의 운세, 마음 정리, 관계, 선택 중 지금 고민에 맞는 리딩을 골라보세요.</p>
            <ul>
              <li>목적에 맞는 1장 · 3장 · 5장 리딩</li>
              <li>카드를 직접 고르고 단계별로 확인</li>
            </ul>
            <Link href="/tarot" className="primary-button" aria-label="타로 리딩 시작">
              타로 리딩 시작 <span>→</span>
            </Link>
          </article>
          <article className="reading-card saju-card">
            <div className="card-symbol">命</div>
            <p className="card-kicker">생년월일시로 살펴보는 나</p>
            <h3>AI 사주</h3>
            <p>양력 생년월일시를 바탕으로 타고난 성향과 삶의 흐름을 이해하기 쉽게 풀어봐요.</p>
            <ul>
              <li>양력 기준 근사 베타 리딩</li>
              <li>어려운 용어를 줄인 쉬운 해설</li>
            </ul>
            <Link href="/saju" className="secondary-button" aria-label="사주 리딩 시작">
              사주 리딩 시작 <span>→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="how-it-works page-width">
        <div className="section-heading">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>선택부터 결과까지, 어렵지 않게</h2>
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
    </>
  );
}
