export default function PrivacyPage() {
  return (
    <article className="simple-page legal page-width">
      <p className="eyebrow">PRIVACY</p>
      <h1>개인정보 처리 원칙</h1>
      <h2 id="collection">최소한으로 수집합니다</h2>
      <p>리딩 생성에 필요한 출생 정보와 질문은 명시적인 동의를 받은 뒤 처리합니다.</p>
      <h2 id="reading-inputs">리딩 입력 정보는 생성과 기록에만 사용합니다</h2>
      <p>출생 정보와 질문 내용은 리딩을 만들고 저장된 결과를 다시 보여주기 위해 처리합니다.</p>
      <h2>당신이 통제합니다</h2>
      <p>저장한 리딩은 개별 삭제할 수 있고, 계정 설정에서 계정 전체 삭제를 요청할 수 있습니다.</p>
      <h2>분석 로그에 민감 정보를 남기지 않습니다</h2>
      <p>퍼널 분석에는 리딩 종류, 단계, 오류 코드와 익명 세션 식별자만 사용합니다.</p>
    </article>
  );
}
