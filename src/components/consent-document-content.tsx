import {
  AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
  OPENAI_DOMESTIC_PROCESSING_COUNTRIES,
  OPENAI_OVERSEAS_PROCESSING_COUNTRIES,
  OPENAI_PUBLISHED_PROCESSING_COUNTRIES,
  OPENAI_TRANSFER_SNAPSHOT,
  PRIVACY_DOCUMENT_VERSION,
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

  return (
    <div className="consent-document-content">
      <DocumentMeta version={PRIVACY_DOCUMENT_VERSION} />
      <p>서비스 &quot;명로&quot;를 운영하는 {LEGAL_METADATA.operatorName}은 서비스 제공을 위해 필요한 범위에서 개인정보를 처리합니다.</p>
      <Heading>개인정보 처리 항목과 보유기간</Heading>
      <div className="consent-table-wrapper">
        <table className="consent-processing-table">
          <caption className="sr-only">명로 개인정보 처리 항목과 보유기간</caption>
          <thead>
            <tr>
              <th scope="col">처리 목적</th>
              <th scope="col">처리 항목</th>
              <th scope="col">처리 근거</th>
              <th scope="col">보유기간·삭제 기준</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">소셜 로그인과 계정 식별</th>
              <td>명로 사용자 식별자, OAuth 제공자와 제공자 사용자 식별자, 계정 생성·변경 시각</td>
              <td><ContractPerformanceBasis /></td>
              <td>계정 삭제 시 명로 운영 데이터베이스에서 즉시 영구 삭제</td>
            </tr>
            <tr>
              <th scope="row">리딩 크레딧과 서비스 상태 관리</th>
              <td>무료·유료 크레딧 잔액, 무료 크레딧 기준일, 리딩 생성 상태와 사용 크레딧</td>
              <td><ContractPerformanceBasis /></td>
              <td>계정 삭제 시 즉시 영구 삭제</td>
            </tr>
            <tr>
              <th scope="row">만 19세 이상 이용자격 확인</th>
              <td>만 19세 이상 확인 여부, 정책 버전, 확인 시각·방법, 가입 시도 세대 식별자</td>
              <td><ContractPerformanceBasis /></td>
              <td>계정 삭제 시 즉시 영구 삭제. 생년월일과 신분증 정보는 수집하지 않음</td>
            </tr>
            <tr>
              <th scope="row">약관과 AI 국외이전 동의 이력 관리</th>
              <td>문서 종류·버전, 동의 또는 철회 동작, 발생 시각·방법</td>
              <td>이용자 동의 이행과 철회 상태 관리</td>
              <td>계정 삭제 시 즉시 영구 삭제</td>
            </tr>
            <tr>
              <th scope="row">타로 리딩 생성·저장·조회</th>
              <td>리딩·요청 식별자, 리딩 종류·스프레드·버전, 카드 식별자·위치·방향, 원문 미포함 입력 식별값, 제목·결과·상태·오류 코드·크레딧 비용, 모델·프롬프트 등 생성 정보</td>
              <td><ContractPerformanceBasis /></td>
              <td>개별 리딩 삭제 또는 계정 삭제 시 즉시 영구 삭제</td>
            </tr>
            <tr>
              <th scope="row">사주 리딩 생성·저장·조회</th>
              <td>대상 연도, 확정 기둥·일간·오행·십성·합충·대운·세운·불확실성 등 최소 계산정보, HMAC 방식 원문 미포함 입력 식별값, 리딩 결과·상태·생성 정보</td>
              <td><ContractPerformanceBasis /></td>
              <td>개별 리딩 삭제 또는 계정 삭제 시 즉시 영구 삭제</td>
            </tr>
            <tr>
              <th scope="row">AI 리딩 요청 처리</th>
              <td>이용자가 작성한 질문·선택지·관심 분야</td>
              <td><ContractPerformanceBasis /></td>
              <td>요청 처리 완료 시 명로 서버에서 폐기. 명로 데이터베이스와 운영 로그에는 저장하지 않음. OpenAI의 보유기간은 아래 국외 처리위탁 항목을 따름</td>
            </tr>
            <tr>
              <th scope="row">사주 계산</th>
              <td>양력 생년월일, 출생시각 또는 출생시각 정확도, 출생 시·도, 대운 계산 기준</td>
              <td><ContractPerformanceBasis /></td>
              <td>사주 계산 요청 처리 완료 시 폐기. 명로 데이터베이스에 저장하지 않고 OpenAI에도 전송하지 않음</td>
            </tr>
            <tr>
              <th scope="row">로그인과 가입 대기 세션</th>
              <td>로그인 세션의 명로 사용자 식별자와 권한, 가입 대기 중 OAuth 제공자·제공자 사용자 식별자·access token·가입 시도 식별자</td>
              <td><ContractPerformanceBasis /></td>
              <td>30분 미사용 시 만료. 로그아웃·가입 완료·취소·계정 삭제 또는 비영속 Redis 재시작 시 삭제</td>
            </tr>
            <tr>
              <th scope="row">무료 오늘의 운세 이어보기</th>
              <td>한국 날짜, SHA-256 계정 범위값 또는 비회원 구분, 뽑기 식별자, 카드·콘텐츠 식별자와 버전</td>
              <td><ContractPerformanceBasis /></td>
              <td>명로 서버에는 저장하지 않고 현재 브라우저에만 저장. 날짜가 지난 뒤 다음 페이지 방문 시 삭제하며, 계정 삭제 성공 시 현재 브라우저의 해당 계정 값 삭제</td>
            </tr>
            <tr>
              <th scope="row">서비스 보안과 오류·장애 대응</th>
              <td>오류가 발생한 경우의 리딩 식별자, 모델·리딩 종류·종료 사유·응답 크기·토큰 사용량 등 진단정보</td>
              <td>개인정보 보호법 제15조 제1항 제6호에 따른 서비스의 안정적 운영과 정당한 이익</td>
              <td>최대 30일 후 자동 삭제</td>
            </tr>
            <tr>
              <th scope="row">OpenAI를 통한 AI 리딩 생성</th>
              <td>질문·선택지·관심 분야, 카드 선택정보, 최소 사주 계산정보</td>
              <td><OverseasTransferConsentBasis /></td>
              <td>오남용 감시 로그 최대 30일, 적용되는 프롬프트 캐시 최대 24시간. 법적 의무가 있거나 서비스 또는 제3자를 위해로부터 보호하기 위해 합리적으로 필요한 경우 더 오래 보관될 수 있음</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>원본 출생정보는 사주 계산과 AI에 전달할 최소 계산정보 생성 과정에서만 일시적으로 처리합니다. 질문·선택지·관심 분야와 원본 출생정보는 명로 데이터베이스와 운영 로그에 남기지 않습니다.</p>
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

function ContractPerformanceBasis() {
  return (
    <>
      <a href="https://www.law.go.kr/LSW/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029335389" rel="noreferrer" target="_blank">
        개인정보 보호법 제15조 제1항 제4호
      </a>
      에 따른 계약 이행 및 이용자 요청 처리
    </>
  );
}

function OverseasTransferConsentBasis() {
  return (
    <>
      <a href="https://law.go.kr/lsLinkCommonInfo.do?chrClsCd=010202&lsJoLnkSeq=1029331979" rel="noreferrer" target="_blank">
        개인정보 보호법 제28조의8 제1항 제1호
      </a>
      에 따른 국외이전 별도 동의
    </>
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
  const { directRecipient, dynamicProcessor, processorGroups } = OPENAI_TRANSFER_SNAPSHOT;
  return (
    <>
      <Heading>이전되는 개인정보 항목</Heading>
      <ul>
        <li>이용자가 작성한 타로·사주 질문과 선택지</li>
        <li>타로 카드 선택 정보와 리딩 유형</li>
        <li>사주 원본 출생정보로 명로 서버에서 계산한 확정 기둥·일간·오행·십성·합충·현재 대운·세운·불확실성 등의 최소 명식 정보와 관심 분야</li>
      </ul>
      <p>원본 생년월일, 출생시각과 출생 시·도, 로그인 이메일, OAuth 식별자, 명로 사용자 ID와 사용자 연계 safety_identifier는 OpenAI API에 전송하지 않습니다.</p>
      <Heading>이전 국가</Heading>
      <p>
        직접 이전받는 자의 소재국이자 주된 고지 국가는 미국입니다. 다만 Global API는
        미국에서만 처리되는 서비스가 아니며, 아래 OpenAI 계열사와 하위처리자의 공개
        처리 가능 국가에서 처리될 수 있습니다.
      </p>
      <p>
        국외 처리 가능 국가: {OPENAI_OVERSEAS_PROCESSING_COUNTRIES.join(", ")}
      </p>
      <p>
        국내 처리 가능 위치: {OPENAI_DOMESTIC_PROCESSING_COUNTRIES.join(", ")}
      </p>
      <div className="consent-table-wrapper">
        <table className="consent-processing-table consent-processor-table">
          <caption>OpenAI API 외부 처리자와 처리 가능 국가</caption>
          <thead>
            <tr>
              <th scope="col">역할</th>
              <th scope="col">처리자</th>
              <th scope="col">처리 가능 국가</th>
              <th scope="col">목적·적용 조건</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">직접 이전받는 자</th>
              <td>{directRecipient.name}</td>
              <td>{directRecipient.country}</td>
              <td>{directRecipient.purpose}</td>
            </tr>
            {processorGroups.flatMap((group) =>
              group.processors.map((processor, processorIndex) => (
                <tr key={`${group.id}-${processor.name}`}>
                  {processorIndex === 0 ? (
                    <th scope="rowgroup" rowSpan={group.processors.length}>{group.label}</th>
                  ) : null}
                  <td>{processor.name}</td>
                  <td>{processor.countries.join(", ")}</td>
                  <td>
                    {processor.purpose}
                    {"condition" in processor ? ` · ${processor.condition}` : ""}
                  </td>
                </tr>
              )),
            )}
            <tr>
              <th scope="row">동적 네트워크 처리</th>
              <td>{dynamicProcessor.name}</td>
              <td>{dynamicProcessor.location}</td>
              <td>{dynamicProcessor.purpose}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        위 표의 정적 처리 국가 수는 국내 위치를 포함해 {OPENAI_PUBLISHED_PROCESSING_COUNTRIES.length}개입니다.
        모든 처리자가 모든 요청을 처리하는 것은 아닙니다. 고객지원 업체는 지원 요청에서
        내용을 공유한 경우, 콘텐츠 검토 업체는 관련 콘텐츠가 안전 검토 대상으로 분류된
        경우 등에 한해 적용될 수 있습니다. {dynamicProcessor.name}는 이용자와 가장 가까운
        데이터센터를 사용할 수 있어 Global 경로의 전체 국가를 폐쇄 목록으로 확정할 수 없습니다.
      </p>
      <p>
        OpenAI 원문 갱신일 {OPENAI_TRANSFER_SNAPSHOT.sourceUpdatedAt} · 명로 최종 확인일 {OPENAI_TRANSFER_SNAPSHOT.verifiedAt}. 최신 처리자와 소재지는 {" "}
        <a href={OPENAI_TRANSFER_SNAPSHOT.sourceUrl} rel="noreferrer" target="_blank">
          OpenAI 하위처리자 목록
        </a>
        에서 확인할 수 있습니다.
      </p>
      <Heading>이전 시기와 방법</Heading>
      <p>이용자가 AI 리딩 생성을 요청할 때 암호화된 통신망을 통해 API 방식으로 이전됩니다.</p>
      <Heading>이전받는 자와 연락처</Heading>
      <dl>
        <div><dt>법인명</dt><dd>{directRecipient.name}</dd></div>
        <div><dt>주소</dt><dd>{directRecipient.address}</dd></div>
        <div><dt>개인정보 문의</dt><dd>{directRecipient.contact}</dd></div>
      </dl>
      <Heading>이전 목적</Heading>
      <p>입력 내용과 계산 정보를 바탕으로 AI 타로·사주 리딩 콘텐츠를 생성하기 위해 처리합니다.</p>
      <Heading>보유·이용 기간</Heading>
      <p>명로는 Chat Completions API 요청에 store=false를 설정해 OpenAI 응답 저장 기능을 비활성화합니다. 다만 오남용 감시 로그에 입력과 출력이 포함되어 최대 30일 보관될 수 있고, 적용되는 프롬프트 캐시는 최대 24시간 보관될 수 있습니다. store=false는 이러한 오남용 감시 로그와 프롬프트 캐시를 제거하지 않습니다. 법적 의무가 있거나 서비스 또는 제3자를 위해로부터 보호하기 위해 합리적으로 필요한 경우 더 오래 보관될 수 있으며, OpenAI는 API 입력을 명시적 선택 없이 모델 학습에 사용하지 않습니다.</p>
      <Heading>동의 거부와 철회</Heading>
      <p>동의를 거부하거나 계정 설정에서 철회할 수 있습니다. 이 경우 신규 AI 타로·사주 리딩은 생성할 수 없지만, 무료 오늘의 운세와 기존 기록의 열람·삭제는 계속 이용할 수 있습니다.</p>
    </>
  );
}
