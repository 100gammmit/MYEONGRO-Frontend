import {
  PRIVACY_DOCUMENT_VERSION,
  TERMS_DOCUMENT_VERSION,
} from "@/domain/consent/documents";

export type ConsentDocumentType = "terms" | "privacy" | "sensitive-data";

export function ConsentDocumentContent({
  documentType,
  headingLevel = "h2",
}: {
  documentType: ConsentDocumentType;
  headingLevel?: "h2" | "h3";
}) {
  const Heading = headingLevel;

  if (documentType === "terms") {
    return (
      <div className="consent-document-content">
        <p>문서 버전 {TERMS_DOCUMENT_VERSION}</p>
        <Heading>리딩 콘텐츠의 성격</Heading>
        <p>명로의 타로와 사주 리딩은 자기 성찰과 오락을 위한 참고 정보이며, 전문적인 의료·법률·재정 조언을 대신하지 않습니다.</p>
        <Heading>서비스 이용과 기록</Heading>
        <p>로그인 후 AI 타로·사주 리딩을 생성할 수 있으며, 생성한 결과는 내 기록에서 확인하고 삭제할 수 있습니다. 무료 오늘의 운세는 로그인 없이 이용하며 내 기록에 저장되지 않습니다.</p>
        <Heading>크레딧과 서비스 제공</Heading>
        <p>AI 리딩을 생성할 때 화면에 안내된 크레딧이 사용됩니다. 점검이나 장애가 발생하면 일부 기능을 일시적으로 이용하지 못할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <div className="consent-document-content">
      <p>문서 버전 {PRIVACY_DOCUMENT_VERSION} · 개인정보 및 출생 정보·질문 내용 처리</p>
      <Heading>최소한으로 수집합니다</Heading>
      <p>리딩 생성에 필요한 출생 정보와 질문은 명시적인 동의를 받은 뒤 처리합니다.</p>
      <Heading>당신이 통제합니다</Heading>
      <p>저장한 리딩은 개별 삭제할 수 있고, 계정 설정에서 계정 전체 삭제를 요청할 수 있습니다.</p>
      <Heading>분석 로그에 민감 정보를 남기지 않습니다</Heading>
      <p>퍼널 분석에는 리딩 종류, 단계, 오류 코드와 익명 세션 식별자만 사용합니다.</p>
    </div>
  );
}
