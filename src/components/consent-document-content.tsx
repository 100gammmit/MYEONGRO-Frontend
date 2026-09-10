import {
  AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
  OPENAI_SUBPROCESSOR_COUNTRY_SNAPSHOT,
  OPENAI_SUBPROCESSOR_LIST_URL,
  PRIVACY_DOCUMENT_VERSION,
  SAJU_INPUT_DOCUMENT_VERSION,
  TERMS_DOCUMENT_VERSION,
  type ConsentDocumentType as RequiredConsentDocumentType,
} from "@/domain/consent/documents";
import { LEGAL_METADATA } from "@/domain/consent/legal-metadata";

export type ConsentDocumentType = RequiredConsentDocumentType | "privacy";

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
        <DocumentMeta version={TERMS_DOCUMENT_VERSION} />
        <Heading>리딩 콘텐츠의 성격</Heading>
        <p>명로의 타로와 사주 리딩은 자기 성찰과 오락을 위한 참고 정보이며, 전문적인 의료·법률·재정 조언을 대신하지 않습니다.</p>
        <Heading>서비스 이용과 기록</Heading>
        <p>로그인 후 AI 타로·사주 리딩을 생성할 수 있으며, 생성한 결과는 내 기록에서 확인하고 삭제할 수 있습니다. 무료 오늘의 운세는 로그인 없이 이용하며 내 기록에 저장되지 않습니다.</p>
        <Heading>연령 이용자격</Heading>
        <p>회원 및 AI 리딩 서비스는 만 19세 이상만 이용할 수 있습니다. 로그인 전에 만 19세 이상임을 직접 확인해야 하며, 명로는 이 확인을 위해 생년월일이나 신분증 정보를 수집하지 않습니다.</p>
        <Heading>크레딧과 서비스 제공</Heading>
        <p>AI 리딩을 생성할 때 화면에 안내된 크레딧이 사용됩니다. 점검이나 장애가 발생하면 일부 기능을 일시적으로 이용하지 못할 수 있습니다.</p>
      </div>
    );
  }

  if (documentType === "ai-overseas-transfer") {
    return (
      <div className="consent-document-content">
        <DocumentMeta version={AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION} />
        <p>
          {LEGAL_METADATA.operatorName}은 AI 리딩 생성을 위해 아래 정보를 국외에 이전하여
          처리합니다. 내용을 확인한 뒤 동의 여부를 선택할 수 있습니다.
        </p>
        <AiOverseasTransferDetails headingLevel={headingLevel} />
      </div>
    );
  }

  if (documentType === "saju-input") {
    return (
      <div className="consent-document-content">
        <DocumentMeta version={SAJU_INPUT_DOCUMENT_VERSION} />
        <p>{LEGAL_METADATA.operatorName}은 사주 리딩 제공을 위해 아래 출생정보를 처리합니다.</p>
        <Heading>처리하는 정보</Heading>
        <ul>
          <li>양력 생년월일</li>
          <li>출생시각 또는 출생시각 정확도</li>
          <li>출생 시·도</li>
          <li>대운 계산 기준 선택값</li>
        </ul>
        <Heading>처리 목적과 방법</Heading>
        <p>명로 서버에서 사주 명식과 흐름을 계산하고, 출생정보·계산 기준과 생성된 사주 리딩을 내 기록에 저장합니다. 질문 원문은 명로 데이터베이스에 저장하지 않습니다. 원본 출생정보는 OpenAI API에 전송하지 않고, 서버에서 계산한 명식 정보만 질문과 함께 전송합니다.</p>
        <Heading>보유·이용 기간</Heading>
        <p>개별 사주 기록을 삭제하거나 계정을 삭제할 때까지 보유합니다. 처리 중단이나 삭제를 원하면 내 기록에서 개별 기록을 삭제하거나 {LEGAL_METADATA.privacyEmail}로 요청할 수 있습니다.</p>
        <Heading>동의 거부 안내</Heading>
        <p>동의하지 않을 수 있으며, 이 경우 사주 리딩 생성 기능은 이용할 수 없습니다. AI 타로와 무료 오늘의 운세 이용에는 영향을 주지 않습니다.</p>
      </div>
    );
  }

  return (
    <div className="consent-document-content">
      <DocumentMeta version={PRIVACY_DOCUMENT_VERSION} />
      <p>서비스 &quot;명로&quot;를 운영하는 {LEGAL_METADATA.operatorName}은 서비스 제공을 위해 필요한 범위에서 개인정보를 처리합니다.</p>
      <Heading>처리 목적과 항목</Heading>
      <p>소셜 로그인 계정 식별, 연령 이용자격 확인, AI 리딩 생성, 리딩 기록 저장·조회·삭제, 서비스 보안과 장애 대응을 위해 OAuth 프로필 정보, 만 19세 이상 확인 여부와 정책 버전·확인 시각, 이용자가 작성한 질문·선택지, 사주 리딩의 출생정보와 서비스 이용 기록을 처리합니다. 질문과 선택지 원문은 AI 리딩 생성 중에만 사용하고 명로 데이터베이스에는 저장하지 않습니다. 연령 확인을 위해 생년월일이나 신분증 정보는 수집하지 않습니다.</p>
      <Heading>국외 처리위탁</Heading>
      <p>AI 리딩 생성에는 OpenAI OpCo, LLC의 Global API를 사용합니다. 아래 국외이전 세부 내용은 로그인하지 않아도 언제든 확인할 수 있습니다.</p>
      <AiOverseasTransferDetails headingLevel={headingLevel} />
      <Heading>보유와 이용자 권리</Heading>
      <p>연령 이용자격 확인 이력은 계정을 유지하는 동안 보관합니다. 저장한 리딩은 개별 삭제할 수 있습니다. 계정 설정에서 계정 삭제를 요청하면 프로필, 로그인 연결, 연령 확인 이력, 리딩과 동의 이력이 명로 운영 데이터베이스에서 즉시 영구 삭제되며 복구할 수 없습니다. AI 국외이전 동의는 계정 설정에서 별도로 철회할 수 있습니다. 개인정보 관련 문의와 권리 행사는 {LEGAL_METADATA.privacyEmail}로 요청할 수 있습니다.</p>
      <Heading>안전성 확보 조치</Heading>
      <p>질문·선택지 원문은 명로 데이터베이스와 운영 로그에 남기지 않고, 인증 비밀 값은 서버 환경에서 관리합니다. 질문 입력 전 일부 직접 식별정보 형식을 자동 검사하지만 모든 개인정보나 민감한 내용을 탐지한다고 보장하지 않습니다.</p>
    </div>
  );
}

function DocumentMeta({ version }: { version: string }) {
  return (
    <p className="consent-document-meta">
      문서 버전 {version} · 시행일 {LEGAL_METADATA.effectiveDate}
    </p>
  );
}

function AiOverseasTransferDetails({
  headingLevel,
}: {
  headingLevel: "h2" | "h3";
}) {
  const Heading = headingLevel;
  return (
    <>
      <Heading>이전되는 개인정보 항목</Heading>
      <ul>
        <li>이용자가 작성한 타로·사주 질문과 선택지</li>
        <li>타로 카드 선택 정보와 리딩 유형</li>
        <li>사주 원본 출생정보로 명로 서버에서 계산한 간지·오행·대운·세운 등의 명식 정보와 관심 분야</li>
      </ul>
      <p>원본 생년월일, 출생시각과 출생 시·도, 로그인 이메일, OAuth 식별자와 명로 사용자 ID는 OpenAI API에 전송하지 않습니다.</p>
      <Heading>이전 국가</Heading>
      <p>
        미국을 포함하여 OpenAI가 공개한 하위처리자 목록의 Customer Content 처리 가능
        국가로 이전될 수 있습니다. 2026년 7월 9일 공개 목록을 기준으로 보수적으로
        정리한 국가는 다음과 같습니다.
      </p>
      <p className="consent-country-list">
        {OPENAI_SUBPROCESSOR_COUNTRY_SNAPSHOT.join(", ")}
      </p>
      <p>
        네트워크 보안·전송을 담당하는 Cloudflare는 이용자와 가까운 데이터센터에서
        정보를 처리할 수 있어 국가가 위 목록에 한정되지 않을 수 있습니다. 최신 처리자와
        소재지는 {" "}
        <a href={OPENAI_SUBPROCESSOR_LIST_URL} rel="noreferrer" target="_blank">
          OpenAI 하위처리자 목록
        </a>
        에서 확인할 수 있습니다.
      </p>
      <Heading>이전 시기와 방법</Heading>
      <p>이용자가 AI 리딩 생성을 요청할 때 암호화된 통신망을 통해 API 방식으로 이전됩니다.</p>
      <Heading>이전받는 자와 연락처</Heading>
      <dl>
        <div><dt>법인명</dt><dd>OpenAI OpCo, LLC</dd></div>
        <div><dt>주소</dt><dd>1455 3rd Street, San Francisco, California 94158, United States</dd></div>
        <div><dt>개인정보 문의</dt><dd>privacy@openai.com</dd></div>
      </dl>
      <Heading>이전 목적</Heading>
      <p>입력 내용과 계산 정보를 바탕으로 AI 타로·사주 리딩 콘텐츠를 생성하기 위해 처리합니다.</p>
      <Heading>보유·이용 기간</Heading>
      <p>Chat Completions API는 일반적인 서비스 상태를 별도로 저장하지 않지만, 오남용 감시 로그에 입력과 출력이 포함되어 최대 30일 보관될 수 있습니다. 적용되는 경우 프롬프트 캐시는 최대 24시간 보관될 수 있으며, 법적 의무 또는 심각한 위해 방지를 위한 예외가 적용될 수 있습니다. OpenAI는 API 입력을 명시적 선택 없이 모델 학습에 사용하지 않습니다.</p>
      <Heading>동의 거부와 철회</Heading>
      <p>동의를 거부하거나 계정 설정에서 철회할 수 있습니다. 이 경우 신규 AI 타로·사주 리딩은 생성할 수 없지만, 무료 오늘의 운세와 기존 기록의 열람·삭제는 계속 이용할 수 있습니다.</p>
    </>
  );
}
