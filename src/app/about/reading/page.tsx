import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "명로가 리딩하는 방식 | AI 타로·사주",
  description:
    "일반적인 AI 대화와 달리 명로가 타로와 사주를 계산하고 구조화하고 해석하는 방식을 확인해 보세요.",
};

const comparisonRows = [
  {
    label: "시작 방식",
    generalAi: "사용자가 질문과 지시를 직접 구성합니다.",
    fixedFortune: "생년이나 별자리 등에 맞춘 정해진 콘텐츠를 보여줍니다.",
    myeongro: "리딩 목적과 배열 또는 관심 분야를 먼저 고른 뒤 질문을 연결합니다.",
  },
  {
    label: "타로",
    generalAi: "카드 선택과 배열까지 AI에게 맡길 수 있습니다.",
    fixedFortune: "미리 작성된 카드 설명을 중심으로 읽습니다.",
    myeongro: "사용자가 카드를 고르고, 정해진 위치의 의미에 맞춰 AI가 해석합니다.",
  },
  {
    label: "사주",
    generalAi: "대화 안에서 AI가 명식 계산과 해설을 함께 만들 수 있습니다.",
    fixedFortune: "간단한 입력에 대응하는 정해진 결과를 보여줍니다.",
    myeongro: "서버가 정해진 규칙으로 명식을 계산하고, AI는 확정된 계산 결과를 해설합니다.",
  },
  {
    label: "질문과 결과",
    generalAi: "프롬프트와 대화 흐름에 따라 형식이 달라집니다.",
    fixedFortune: "개인 질문을 세밀하게 반영하기 어렵습니다.",
    myeongro: "정해진 결과 구조 안에서 질문과 선택한 리딩 초점을 함께 살핍니다.",
  },
  {
    label: "안전과 기록",
    generalAi: "사용 중인 대화 서비스의 설정과 정책을 따릅니다.",
    fixedFortune: "서비스에 따라 제공 범위가 다릅니다.",
    myeongro: "중요한 결정을 대신하지 않으며, 질문 원문 대신 리딩 결과와 필요한 구조화 정보만 기록합니다.",
  },
] as const;

const tarotSteps = [
  ["01", "리딩 목적 선택", "마음 정리·관계·선택처럼 지금 필요한 리딩 구조를 고릅니다."],
  ["02", "질문과 카드 선택", "질문을 남기고 각 위치를 생각하며 사용자가 직접 카드를 고릅니다."],
  ["03", "위치별 해석", "AI가 카드마다 정해진 역할과 전체 흐름을 함께 해석합니다."],
] as const;

const sajuSteps = [
  ["01", "출생정보 입력", "생년월일시와 출생 지역, 알고 있는 정보의 정확도를 입력합니다."],
  ["02", "서버 명식 계산", "절기와 간지 등 정해진 계산 규칙으로 명식과 해석 기준을 만듭니다."],
  ["03", "질문과 해설 연결", "AI가 계산된 정보와 관심 분야를 바탕으로 질문에 맞는 해설을 구성합니다."],
] as const;

export default function ReadingMethodPage() {
  return (
    <article className="reading-method-page">
      <header className="reading-method-hero page-width">
        <p className="eyebrow">HOW MYEONGRO READS</p>
        <h1>그냥 AI에게 물어보는 것과<br />무엇이 다른가요?</h1>
        <p>
          명로는 질문을 곧바로 AI에 맡기지 않습니다. 먼저 계산하고, 리딩의 구조를 정하고,
          해석이 넘어서는 안 될 경계를 세운 뒤 결과를 만듭니다.
        </p>
      </header>

      <section className="reading-method-section page-width" aria-labelledby="principles-title">
        <div className="reading-method-heading">
          <p className="eyebrow">THREE PRINCIPLES</p>
          <h2 id="principles-title">계산과 해석, 선택의 역할을 나눕니다</h2>
        </div>
        <div className="method-principles">
          <article>
            <span>01</span>
            <h3>계산은 정해진 규칙으로</h3>
            <p>사주 명식은 LLM이 추측하지 않고, 명로 서버가 버전이 있는 계산 규칙으로 만듭니다.</p>
          </article>
          <article>
            <span>02</span>
            <h3>해석은 정해진 구조 안에서</h3>
            <p>타로 배열과 사주 결과 항목을 먼저 정해, 매번 다른 대화 형식에만 의존하지 않습니다.</p>
          </article>
          <article>
            <span>03</span>
            <h3>마지막 선택은 사용자에게</h3>
            <p>리딩은 생각을 정리하는 참고 자료이며, 중요한 결정이나 전문적인 판단을 대신하지 않습니다.</p>
          </article>
        </div>
      </section>

      <section className="reading-method-section page-width" aria-labelledby="comparison-title">
        <div className="reading-method-heading">
          <p className="eyebrow">A STRUCTURED READING</p>
          <h2 id="comparison-title">같은 AI라도 사용하는 방식이 다릅니다</h2>
          <p>서비스의 우열이 아니라, 질문을 받아 결과를 만드는 구조의 차이를 비교합니다.</p>
        </div>
        <div
          aria-label="일반 LLM 대화, 고정형 운세 콘텐츠와 명로 비교"
          className="method-comparison-scroll"
          role="region"
          tabIndex={0}
        >
          <table className="method-comparison">
            <caption className="sr-only">서비스 유형별 리딩 구조 비교</caption>
            <thead>
              <tr>
                <th scope="col">구분</th>
                <th scope="col">일반 LLM 대화</th>
                <th scope="col">고정형 운세 콘텐츠</th>
                <th className="myeongro-column" scope="col">명로</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.generalAi}</td>
                  <td>{row.fixedFortune}</td>
                  <td className="myeongro-column">{row.myeongro}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="method-comparison-hint">작은 화면에서는 표를 좌우로 움직여 볼 수 있습니다.</p>
      </section>

      <section className="reading-method-section method-paths page-width" aria-labelledby="paths-title">
        <div className="reading-method-heading">
          <p className="eyebrow">READING PROCESS</p>
          <h2 id="paths-title">타로와 사주는 서로 다른 과정을 거칩니다</h2>
        </div>
        <div className="method-path-grid">
          <article className="method-path-card tarot-path">
            <p className="method-path-kicker">TAROT</p>
            <h3>카드의 자리를 먼저 정합니다</h3>
            <ol>
              {tarotSteps.map(([number, title, copy]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/tarot">타로 리딩 살펴보기 <span aria-hidden="true">→</span></Link>
          </article>
          <article className="method-path-card saju-path">
            <p className="method-path-kicker">SAJU</p>
            <h3>계산한 뒤 해석합니다</h3>
            <ol>
              {sajuSteps.map(([number, title, copy]) => (
                <li key={number}>
                  <span>{number}</span>
                  <div>
                    <strong>{title}</strong>
                    <p>{copy}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link href="/saju">사주 리딩 살펴보기 <span aria-hidden="true">→</span></Link>
          </article>
        </div>
      </section>

      <section className="reading-method-section method-boundaries page-width" aria-labelledby="boundaries-title">
        <div className="reading-method-heading">
          <p className="eyebrow">CLEAR BOUNDARIES</p>
          <h2 id="boundaries-title">리딩이 하지 않는 일도 분명히 합니다</h2>
        </div>
        <div className="method-boundary-layout">
          <ul>
            <li>미래의 사건이나 타인의 마음을 사실처럼 단정하지 않습니다.</li>
            <li>의료·법률·금융 등 전문적인 판단과 중요한 결정을 대신하지 않습니다.</li>
            <li>사주 계산을 AI의 추측에 맡기지 않습니다.</li>
            <li>질문에 따라 특정 운세로 바꿔 읽은 이유를 안내하거나, 안전상 다룰 수 없는 질문은 별도로 안내합니다.</li>
          </ul>
          <aside>
            <h3>정보는 필요한 역할만 맡습니다</h3>
            <p>
              질문과 선택지 원문은 AI 리딩 생성 중에만 사용하고 명로 데이터베이스에는 저장하지 않습니다.
              사주는 원본 출생정보 대신 서버에서 계산한 명식 정보를 AI 해설에 사용합니다.
            </p>
            <Link href="/privacy">개인정보 처리 방식 자세히 보기 <span aria-hidden="true">→</span></Link>
          </aside>
        </div>
      </section>

      <section className="method-closing" aria-labelledby="method-closing-title">
        <div className="page-width">
          <p className="eyebrow">START A READING</p>
          <h2 id="method-closing-title">어떤 방식이 지금의 질문과 더 가까운가요?</h2>
          <div>
            <Link className="primary-button" href="/tarot">타로로 시작</Link>
            <Link className="secondary-button" href="/saju">사주로 시작</Link>
          </div>
          <Link className="method-daily-link" href="/tarot/daily">로그인 없이 오늘의 운세 보기</Link>
        </div>
      </section>
    </article>
  );
}
