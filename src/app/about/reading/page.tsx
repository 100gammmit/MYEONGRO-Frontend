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
    myeongro: "리딩 목적과 배열, 또는 관심 분야를 먼저 고른 뒤 질문을 이어요.",
    chatbot: "사용자가 질문과 요청을 직접 구성해요.",
    prewritten: "생년이나 별자리처럼 정해진 기준에 맞춘 내용을 보여줘요.",
  },
  {
    label: "타로",
    myeongro: "사용자가 카드를 고르고, AI가 정해진 자리의 의미에 맞춰 해석해요.",
    chatbot: "카드 선택과 배열까지 AI에게 맡길 수 있어요.",
    prewritten: "미리 작성된 카드 설명을 중심으로 읽어요.",
  },
  {
    label: "사주",
    myeongro: "서버가 정해진 규칙으로 명식을 계산하고, AI는 확정된 계산 결과를 해설해요.",
    chatbot: "대화 안에서 AI가 명식 계산과 해설을 함께 만들 수 있어요.",
    prewritten: "간단한 입력에 맞춰 정해진 결과를 보여줘요.",
  },
  {
    label: "질문과 결과",
    myeongro: "정해진 결과 구조 안에서 질문과 선택한 리딩 초점을 함께 살펴요.",
    chatbot: "묻는 방식과 대화 흐름에 따라 답의 형식이 달라져요.",
    prewritten: "개인 질문보다 모두에게 공통된 내용을 중심으로 보여줘요.",
  },
] as const;

const principles = [
  ["01", "계산은 정해진 규칙으로", "사주 명식은 AI가 추측하지 않고, 명로 서버가 버전이 있는 계산 규칙으로 만들어요."],
  ["02", "해석은 정해진 구조 안에서", "타로 배열과 사주 결과 항목을 먼저 정해 두어, 그때그때 달라지는 대화 형식에 기대지 않아요."],
  ["03", "마지막 선택은 사용자에게", "리딩은 생각을 정리하도록 돕는 참고 자료예요. 무엇을 할지는 스스로 정해요."],
] as const;

const tarotSteps = [
  ["01", "리딩 목적 선택", "마음 정리·관계·선택처럼 지금 필요한 리딩 구조를 골라요."],
  ["02", "질문과 카드 선택", "질문을 남기고, 각 자리를 떠올리며 직접 카드를 골라요."],
  ["03", "자리별 해석", "AI가 카드마다 정해진 역할과 전체 흐름을 함께 해석해요."],
] as const;

const sajuSteps = [
  ["01", "출생정보 입력", "생년월일시와 출생 지역, 알고 있는 정보의 정확도를 입력해요."],
  ["02", "서버 명식 계산", "절기와 간지 같은 정해진 계산 규칙으로 명식과 해석 기준을 만들어요."],
  ["03", "질문과 해설 연결", "AI가 계산된 정보와 관심 분야를 바탕으로 질문에 맞는 해설을 구성해요."],
] as const;

export default function ReadingMethodPage() {
  return (
    <article className="reading-method-page">
      <header className="reading-method-hero page-width">
        <p className="eyebrow">HOW MYEONGRO READS</p>
        <h1>그냥 AI에게 물어보는 것과<br />무엇이 다를까요?</h1>
        <p>
          명로는 질문을 곧바로 AI에 맡기지 않아요. 먼저 계산하고, 리딩의 구조를 정하고,
          해석이 넘지 말아야 할 경계를 세운 뒤 결과를 만들어요.
        </p>
      </header>

      <section className="reading-method-section page-width" aria-labelledby="principles-title">
        <div className="reading-method-heading">
          <p className="eyebrow">THREE PRINCIPLES</p>
          <h2 id="principles-title">계산과 해석, 선택의 역할을 나눠요</h2>
        </div>
        <ol className="method-principles">
          {principles.map(([number, title, copy]) => (
            <li key={number}>
              <span aria-hidden="true">{number}</span>
              <h3>{title}</h3>
              <p>{copy}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="reading-method-section page-width" aria-labelledby="comparison-title">
        <div className="reading-method-heading">
          <p className="eyebrow">A STRUCTURED READING</p>
          <h2 id="comparison-title">같은 AI라도 쓰는 방식이 달라요</h2>
          <p>어느 쪽이 낫다는 비교가 아니라, 질문을 받아 결과를 만드는 구조의 차이를 정리했어요.</p>
        </div>
        <p className="method-comparison-hint">표를 좌우로 움직여 다른 방식과 비교할 수 있어요.</p>
        <div
          aria-label="명로, AI 챗봇 대화, 미리 작성된 운세 비교"
          className="method-comparison-scroll"
          role="region"
          tabIndex={0}
        >
          <table className="method-comparison">
            <caption className="sr-only">리딩을 만드는 방식 비교</caption>
            <thead>
              <tr>
                <th scope="col">구분</th>
                <th className="myeongro-column" scope="col">명로</th>
                <th scope="col">AI 챗봇 대화</th>
                <th scope="col">미리 작성된 운세</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td className="myeongro-column">{row.myeongro}</td>
                  <td>{row.chatbot}</td>
                  <td>{row.prewritten}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reading-method-section method-paths page-width" aria-labelledby="paths-title">
        <div className="reading-method-heading">
          <p className="eyebrow">READING PROCESS</p>
          <h2 id="paths-title">타로와 사주는 서로 다른 과정을 거쳐요</h2>
        </div>
        <div className="method-path-grid">
          <article className="method-path-card tarot-path">
            <p className="method-path-kicker">TAROT</p>
            <h3>카드의 자리를 먼저 정해요</h3>
            <ol>
              {tarotSteps.map(([number, title, copy]) => (
                <li key={number}>
                  <span aria-hidden="true">{number}</span>
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
            <h3>계산한 뒤 해석해요</h3>
            <ol>
              {sajuSteps.map(([number, title, copy]) => (
                <li key={number}>
                  <span aria-hidden="true">{number}</span>
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
          <h2 id="boundaries-title">리딩이 하지 않는 일도 분명히 해요</h2>
        </div>
        <ul className="method-boundary-list">
          <li>미래의 사건이나 다른 사람의 마음을 사실처럼 단정하지 않아요.</li>
          <li>의료·법률·금융 같은 전문적인 판단과 중요한 결정을 대신하지 않아요.</li>
          <li>질문에 따라 특정 운세로 바꿔 읽은 이유를 안내하고, 안전상 다룰 수 없는 질문은 따로 알려드려요.</li>
        </ul>
      </section>

      <section className="method-closing" aria-labelledby="method-closing-title">
        <div className="page-width">
          <p className="eyebrow">START A READING</p>
          <h2 id="method-closing-title">어떤 방식이 지금의 질문에 더 가까운가요?</h2>
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
