import { TERMS_DOCUMENT_VERSION } from "@/domain/consent/documents";

export default function TermsPage() {
  return (
    <article className="simple-page legal page-width">
      <p className="eyebrow">TERMS</p>
      <h1>서비스 이용약관</h1>
      <p>문서 버전 {TERMS_DOCUMENT_VERSION}</p>
      <h2>리딩 콘텐츠의 성격</h2>
      <p>명로의 타로와 사주 리딩은 자기 성찰과 오락을 위한 참고 정보이며, 전문적인 의료·법률·재정 조언을 대신하지 않습니다.</p>
      <h2>서비스 이용과 기록</h2>
      <p>로그인 후 AI 타로·사주 리딩을 생성할 수 있으며, 생성한 결과는 내 기록에서 확인하고 삭제할 수 있습니다. 무료 오늘의 운세는 로그인 없이 이용하며 내 기록에 저장되지 않습니다.</p>
      <h2>크레딧과 서비스 제공</h2>
      <p>AI 리딩을 생성할 때 화면에 안내된 크레딧이 사용됩니다. 점검이나 장애가 발생하면 일부 기능을 일시적으로 이용하지 못할 수 있습니다.</p>
    </article>
  );
}
