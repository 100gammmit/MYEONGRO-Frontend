import Link from "next/link";

const features = [
  { number: "01", title: "당신의 질문", copy: "마음에 오래 머문 질문을 조용히 꺼내 놓으세요." },
  { number: "02", title: "정교한 해석", copy: "카드와 명식을 바탕으로 흐름을 읽어드립니다." },
  { number: "03", title: "현실의 한 걸음", copy: "예언에 머물지 않는 구체적인 조언을 받아보세요." },
];

export default function HomePage() {
  return (
    <>
      <section className="hero page-width">
        <div className="hero-copy">
          <p className="eyebrow">AI FORTUNE READING</p>
          <h1>
            당신의 오늘에
            <br />
            필요한 <em>한 문장</em>
          </h1>
          <p className="hero-description">
            오래된 지혜와 새로운 기술이 만나, 지금 당신에게 필요한 이야기를 들려드립니다.
          </p>
          <div className="trust-row">
            <span>비회원 무료 체험</span>
            <span>개인정보 보호</span>
            <span>3분이면 충분해요</span>
          </div>
        </div>
        <div className="hero-orbit" aria-hidden="true">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="moon">月</div>
          <span className="star star-a">✦</span>
          <span className="star star-b">✧</span>
          <span className="star star-c">✦</span>
        </div>
      </section>

      <section className="reading-choice page-width">
        <div className="section-heading">
          <p className="eyebrow">CHOOSE YOUR PATH</p>
          <h2>어떤 이야기가 궁금한가요?</h2>
        </div>
        <div className="choice-grid">
          <article className="reading-card tarot-card">
            <div className="card-symbol">☾</div>
            <p className="card-kicker">지금 이 순간의 흐름</p>
            <h3>AI 타로</h3>
            <p>세 장의 카드가 과거와 현재, 그리고 앞으로 나아갈 방향을 비춥니다.</p>
            <ul>
              <li>연애 · 일 · 재물 · 자유 질문</li>
              <li>직접 고르는 3장 스프레드</li>
            </ul>
            <Link href="/tarot" className="primary-button" aria-label="타로 리딩 시작">
              타로 리딩 시작 <span>→</span>
            </Link>
          </article>
          <article className="reading-card saju-card">
            <div className="card-symbol">命</div>
            <p className="card-kicker">태어난 순간에 담긴 지도</p>
            <h3>AI 사주</h3>
            <p>생년월일시의 네 기둥을 계산해 타고난 성향과 삶의 흐름을 읽습니다.</p>
            <ul>
              <li>정식 사주팔자 명식 계산</li>
              <li>어려운 용어 없는 쉬운 해설</li>
            </ul>
            <Link href="/saju" className="secondary-button" aria-label="사주 분석 시작">
              사주 분석 시작 <span>→</span>
            </Link>
          </article>
        </div>
      </section>

      <section className="how-it-works page-width">
        <div className="section-heading">
          <p className="eyebrow">HOW IT WORKS</p>
          <h2>신비롭지만, 막연하지 않게</h2>
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
