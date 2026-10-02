import {
  AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
  AWS_PROCESSING_DISCLOSURE,
  OPENAI_DOMESTIC_PROCESSING_COUNTRIES,
  OPENAI_OVERSEAS_PROCESSING_COUNTRIES,
  OPENAI_PUBLISHED_PROCESSING_COUNTRIES,
  OPENAI_TRANSFER_SNAPSHOT,
  PRIVACY_INQUIRY_EMAIL_PROCESSING,
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
        <Heading>목적과 운영자</Heading>
        <p>이 약관은 {LEGAL_METADATA.operatorName}(이하 &quot;운영자&quot;)가 제공하는 명로 서비스의 이용 조건과 운영자 및 이용자의 권리·의무를 정합니다. 명로는 생성형 AI를 활용한 타로·사주 리딩, 저장 기록 관리와 AI를 사용하지 않는 무료 오늘의 카드를 제공합니다.</p>
        <p>이 약관에서 &quot;서비스&quot;는 명로가 제공하는 기능 전체를, &quot;회원&quot;은 소셜 로그인 후 가입을 완료한 이용자를, &quot;AI 리딩&quot;은 생성형 AI로 만든 타로·사주 리딩 텍스트를 뜻합니다.</p>
        <Heading>가입과 계정</Heading>
        <p>회원 가입과 AI 리딩은 만 19세 이상만 이용할 수 있습니다. 이용자는 자신이 적법하게 사용할 수 있는 소셜 계정으로 로그인하고 계정 접근수단을 안전하게 관리해야 합니다. 명로는 연령 확인을 위해 생년월일이나 신분증 정보를 수집하지 않습니다.</p>
        <Heading>생성형 AI 사용과 결과의 한계</Heading>
        <p>타로·사주 입력 단계와 결과 화면에는 OpenAI의 생성형 AI가 사용된다는 사실을 표시합니다. AI 리딩은 자기 성찰과 오락을 위한 참고 정보이며 사실, 미래, 정확성 또는 특정 결과를 보장하지 않고 의료·법률·금융 등 전문가의 판단을 대신하지 않습니다.</p>
        <Heading>무료 크레딧</Heading>
        <p>AI 리딩 생성에는 화면에 안내된 크레딧이 사용됩니다. 무료 크레딧은 한국시간을 기준으로 매일 초기화되는 무상 혜택으로, 현금 가치가 없고 환급·양도·이월할 수 없습니다.</p>
        <p>리딩별 사용 크레딧이나 무료 지급량을 변경할 때에는 원칙적으로 7일 전에 서비스 화면으로 알립니다. 이용자에게 불리한 변경은 30일 전에 알리며, 법령·보안 사고 등 긴급한 사유가 있으면 가능한 범위에서 신속히 사후 안내할 수 있습니다.</p>
        <Heading>이용자 입력과 AI 생성 결과</Heading>
        <p>이용자는 자신이 입력한 질문과 선택지 등 입력 내용에 관한 권리를 유지하며, 운영자에게 서비스 제공에 필요한 범위의 처리 권한을 부여합니다. 타인의 개인정보나 권리를 침해하는 내용을 입력해서는 안 됩니다.</p>
        <p>이용자는 적법한 범위에서 자신에게 제공된 AI 생성 리딩 텍스트를 저장·공유하거나 상업적으로 이용할 수 있습니다. 다만 운영자는 결과의 독점성·정확성·제3자 권리 비침해를 보장하지 않습니다. 카드 이미지, UI, 상표와 운영자가 제작한 고정 콘텐츠의 권리는 AI 생성 리딩 텍스트와 별개이며 별도 허락 없이 이용할 수 없습니다.</p>
        <Heading>금지행위와 임시 제한</Heading>
        <p>불법행위, 타인의 권리 침해, 타인 개인정보의 무단 입력, 자동화된 수단을 이용한 과도한 호출, 보안 우회, 역설계 또는 서비스 운영 방해 행위를 금지합니다. 위반이 의심되거나 보안 위험·과부하가 발생하면 필요한 범위에서 개별 요청 또는 서비스 접근을 임시 제한할 수 있습니다.</p>
        <Heading>서비스 변경·중단과 책임</Heading>
        <p>점검, 장애 또는 외부 AI 제공자의 사정으로 일부 기능이 일시 중단될 수 있습니다. 서비스 전체를 종료하는 경우 원칙적으로 30일 전에 서비스 화면으로 알리지만 법령, 보안 사고 또는 불가항력에 따른 긴급 조치는 예외로 합니다.</p>
        <p>운영자는 관련 법령이 허용하는 범위에서 책임을 부담합니다. 운영자의 고의·중과실로 인한 손해와 법령상 배제하거나 제한할 수 없는 소비자 권리 및 책임은 이 약관으로 면제되지 않습니다.</p>
        <Heading>계약 종료와 데이터 삭제</Heading>
        <p>이용자가 계정을 삭제하면 이용계약이 종료되고, 저장된 계정·리딩 정보는 개인정보 처리방침의 삭제 기준에 따라 처리됩니다. 개별 리딩도 이용자가 직접 삭제할 수 있습니다.</p>
        <Heading>약관 변경과 재동의</Heading>
        <p>경미한 문구 정리는 문서 버전을 올리지 않을 수 있습니다. 이용자의 권리·의무가 실질적으로 변경되면 버전을 올리고 일반 변경은 7일 전, 이용자에게 불리한 변경은 30일 전에 서비스 화면으로 알리며, 다음 AI 리딩 생성 전에 새 약관 동의를 받습니다. 새 약관에 동의하지 않아도 로그인, 기존 기록 열람·삭제와 계정 삭제는 이용할 수 있습니다.</p>
        <Heading>준거법과 분쟁</Heading>
        <p>이 약관은 대한민국 법률을 따릅니다. 분쟁이 발생하면 당사자는 성실히 협의하고, 해결되지 않는 경우 민사소송법상 관할법원에 소를 제기할 수 있습니다.</p>
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
              <td>계정 삭제 시 명로 운영 데이터베이스에서 즉시 삭제</td>
            </tr>
            <tr>
              <th scope="row">리딩 크레딧과 서비스 상태 관리</th>
              <td>무료·유료 크레딧 잔액, 무료 크레딧 기준일, 리딩 생성 상태와 사용 크레딧</td>
              <td><ContractPerformanceBasis /></td>
              <td>계정 삭제 시 명로 운영 데이터베이스에서 즉시 삭제</td>
            </tr>
            <tr>
              <th scope="row">만 19세 이상 이용자격 확인</th>
              <td>만 19세 이상 확인 여부, 정책 버전, 확인 시각·방법, 가입 시도 세대 식별자</td>
              <td><ContractPerformanceBasis /></td>
              <td>계정 삭제 시 명로 운영 데이터베이스에서 즉시 삭제. 생년월일과 신분증 정보는 수집하지 않음</td>
            </tr>
            <tr>
              <th scope="row">약관과 AI 국외이전 동의 이력 관리</th>
              <td>문서 종류·버전, 동의 또는 철회 동작, 발생 시각·방법</td>
              <td>이용자 동의 이행과 철회 상태 관리</td>
              <td>계정 삭제 시 명로 운영 데이터베이스에서 즉시 삭제</td>
            </tr>
            <tr>
              <th scope="row">타로 리딩 생성·저장·조회</th>
              <td>리딩·요청 식별자, 리딩 종류·스프레드·버전, 카드 식별자·위치·방향, 원문 미포함 입력 식별값, 제목·결과·상태·오류 코드·크레딧 비용, 모델·프롬프트 등 생성 정보</td>
              <td><ContractPerformanceBasis /></td>
              <td>개별 리딩 삭제 또는 계정 삭제 시 명로 운영 데이터베이스에서 즉시 삭제</td>
            </tr>
            <tr>
              <th scope="row">사주 리딩 생성·저장·조회</th>
              <td>대상 연도, 확정 기둥·일간·오행·십성·합충·대운·세운·불확실성 등 최소 계산정보, HMAC 방식 원문 미포함 입력 식별값, 리딩 결과·상태·생성 정보</td>
              <td><ContractPerformanceBasis /></td>
              <td>개별 리딩 삭제 또는 계정 삭제 시 명로 운영 데이터베이스에서 즉시 삭제</td>
            </tr>
            <tr>
              <th scope="row">AI 리딩 요청 처리</th>
              <td>이용자가 작성한 질문·선택지·관심 분야</td>
              <td><ContractPerformanceBasis /></td>
              <td>요청 처리 완료 시 명로 서버에서 폐기. 명로 데이터베이스와 운영 로그에는 저장하지 않음. OpenAI의 보유기간은 아래 OpenAI AI 리딩 국외이전 항목을 따름</td>
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
              <th scope="row">개인정보 문의와 권리행사 처리</th>
              <td>{PRIVACY_INQUIRY_EMAIL_PROCESSING.items}</td>
              <td><ContractPerformanceBasis /></td>
              <td>{PRIVACY_INQUIRY_EMAIL_PROCESSING.operatorRetention}. 외부 사업자의 삭제 절차는 아래 개인정보 문의 이메일 국외 처리 항목을 따름</td>
            </tr>
            <tr>
              <th scope="row">서비스 보안과 오류·장애 대응</th>
              <td>오류가 발생한 경우의 리딩 식별자, 모델·리딩 종류·종료 사유·응답 크기·토큰 사용량 등 진단정보</td>
              <td>개인정보 보호법 제15조 제1항 제6호에 따른 서비스의 안정적 운영과 정당한 이익</td>
              <td>명로는 로그 event 시각부터 최대 30일 동안만 운영 조회·이용. 30일 경과 시 CloudWatch 보유 정책에 따라 만료·삭제 대상으로 표시되며, 공급자 시스템의 물리적 삭제는 통상 추가 72시간 이내에 처리되나 드물게 더 오래 걸릴 수 있음</td>
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
      <p>운영 데이터베이스에서는 즉시 삭제되며 서비스에서 개별 복구할 수 없습니다. 재해복구용 자동 백업에는 최대 7일간 잔존할 수 있고, 해당 기간이 지나면 자동 삭제됩니다.</p>
      <p>원본 출생정보는 사주 계산과 AI에 전달할 최소 계산정보 생성 과정에서만 일시적으로 처리합니다. 질문·선택지·관심 분야와 원본 출생정보는 명로 데이터베이스와 운영 로그에 남기지 않습니다.</p>
      <Heading>개인정보 처리업무 위탁</Heading>
      <p>명로는 서비스 제공에 필요한 다음 업무를 외부 사업자에게 위탁합니다. 수탁자가 업무에 필요한 범위를 넘어 개인정보를 처리하지 않도록 계약과 서비스 설정을 통해 관리합니다.</p>
      <div className="consent-table-wrapper">
        <table className="consent-processing-table">
          <caption>명로가 직접 이용하는 개인정보 처리 수탁자</caption>
          <thead>
            <tr>
              <th scope="col">수탁자</th>
              <th scope="col">위탁업무</th>
              <th scope="col">보유·이용기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">{AWS_PROCESSING_DISCLOSURE.processor.name}</th>
              <td>{AWS_PROCESSING_DISCLOSURE.outsourcedTasks}</td>
              <td>요청 중계 정보는 요청 처리에 필요한 동안, 저장 정보는 위 처리 항목별 보유기간 동안</td>
            </tr>
            <tr>
              <th scope="row">{OPENAI_TRANSFER_SNAPSHOT.directRecipient.name}</th>
              <td>이용자가 요청한 AI 타로·사주 리딩 생성</td>
              <td>아래 OpenAI 국외이전 세부 내용의 보유·이용 기간에 따름</td>
            </tr>
            <tr>
              <th scope="row">{PRIVACY_INQUIRY_EMAIL_PROCESSING.processors.cloudflare.name}</th>
              <td>개인정보 문의 메일 수신·인증·전달 및 라우팅 상태 기록</td>
              <td>메일 전달에 필요한 동안. 라우팅 이벤트는 최대 31일</td>
            </tr>
            <tr>
              <th scope="row">{PRIVACY_INQUIRY_EMAIL_PROCESSING.processors.google.name}</th>
              <td>개인정보 문의 메일·첨부파일·답변 및 처리 이력의 저장·열람·답변</td>
              <td>문의 처리 완료 후 30일. 영구 삭제 후 Google 암호화 백업에 최대 6개월 잔존 가능</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        AWS와 OpenAI의 서비스 제공에는 각 사업자가 공개한 계열사·하위처리자가 참여할 수 있습니다. AWS의 현재 하위처리자는 {" "}
        <a href={AWS_PROCESSING_DISCLOSURE.sourceUrls.subprocessors} rel="noreferrer" target="_blank">
          AWS 하위처리자 목록
        </a>
        에서 확인할 수 있고, OpenAI의 처리자는 아래 표에서 확인할 수 있습니다.
      </p>
      <Heading>AWS 인프라의 국외 처리</Heading>
      <p>명로의 주된 Backend·세션·데이터베이스·운영 로그 처리 및 저장 위치는 대한민국 서울 리전입니다. 다만 Front 콘텐츠 전송과 API 요청 중계 과정에서는 이용자 접속 위치에 따라 국외의 AWS CloudFront 엣지 로케이션과 AWS가 공개한 서비스 제공 계열사·하위처리자가 관여할 수 있습니다. 모든 이용자 요청이 국외에서 처리되는 것은 아닙니다.</p>
      <dl>
        <div><dt>수탁자</dt><dd>{AWS_PROCESSING_DISCLOSURE.processor.name}</dd></div>
        <div><dt>주소</dt><dd>{AWS_PROCESSING_DISCLOSURE.processor.address}</dd></div>
        <div><dt>개인정보 문의</dt><dd>{AWS_PROCESSING_DISCLOSURE.processor.contact}</dd></div>
        <div><dt>주된 처리 위치</dt><dd>{AWS_PROCESSING_DISCLOSURE.primaryProcessingLocation}</dd></div>
        <div><dt>추가 처리 가능 위치</dt><dd>{AWS_PROCESSING_DISCLOSURE.dynamicProcessingLocation}</dd></div>
        <div><dt>처리 항목</dt><dd>{AWS_PROCESSING_DISCLOSURE.transferItems}</dd></div>
        <div><dt>시기·방법</dt><dd>{AWS_PROCESSING_DISCLOSURE.method}</dd></div>
        <div><dt>목적</dt><dd>{AWS_PROCESSING_DISCLOSURE.outsourcedTasks}</dd></div>
        <div><dt>보유·이용 기간</dt><dd>{AWS_PROCESSING_DISCLOSURE.retention}</dd></div>
        <div><dt>거부 방법·절차</dt><dd>{AWS_PROCESSING_DISCLOSURE.refusalMethod}</dd></div>
        <div><dt>거부 효과</dt><dd>{AWS_PROCESSING_DISCLOSURE.refusalEffect}</dd></div>
      </dl>
      <p>
        위 AWS 국외 처리는 서비스 계약의 이행을 위한 처리위탁·보관에 해당하며, 개인정보 보호법 제28조의8 제1항 제3호 가목에 따라 이 처리방침으로 공개합니다. CloudFront의 처리 국가는 이용자 접속 위치와 AWS 네트워크 운영에 따라 달라질 수 있으며, {" "}
        <a href={AWS_PROCESSING_DISCLOSURE.sourceUrls.edgeLocations} rel="noreferrer" target="_blank">
          AWS의 현재 엣지 로케이션 목록
        </a>
        에서 확인할 수 있습니다. AWS 정보 최종 확인일은 {AWS_PROCESSING_DISCLOSURE.verifiedAt}입니다.
      </p>
      <PrivacyInquiryEmailOverseasDetails headingLevel={headingLevel} />
      <Heading>OpenAI AI 리딩 국외이전</Heading>
      <p>AI 리딩 생성에는 OpenAI OpCo, LLC의 Global API를 사용합니다. 아래 국외이전 세부 내용은 로그인하지 않아도 언제든 확인할 수 있습니다.</p>
      <AiOverseasTransferDetails headingLevel={headingLevel} />
      <Heading>개인정보 파기 절차와 방법</Heading>
      <p>보유기간이 끝나거나 처리 목적이 달성된 개인정보는 지체 없이 파기 대상으로 확정합니다. 이용자가 개별 리딩이나 계정을 삭제하면 운영 데이터베이스의 관련 레코드를 복구 유예 없이 영구 삭제하고, 계정 삭제 시 Redis 세션과 현재 브라우저의 해당 계정 오늘의 카드 값도 삭제합니다. 질문·선택지·관심 분야와 원본 출생정보는 요청 처리가 끝나면 별도로 보유하지 않습니다.</p>
      <p>전자적 기록은 해당 저장소의 삭제 기능으로 복구 대상에서 제거합니다. 재해복구용 자동 백업은 최대 7일, 운영 로그는 명로의 운영 조회·이용 기준 최대 30일이 지나면 각 인프라의 보유 정책에 따라 만료·삭제됩니다. 외부 처리자의 자체 보유분은 위 수탁·국외이전 항목에 적힌 기준을 따릅니다.</p>
      <Heading>이용자 권리와 이의제기</Heading>
      <p>이용자는 계정 설정에서 저장한 리딩의 삭제, 계정 삭제와 AI 국외이전 동의 철회를 직접 할 수 있습니다. 개인정보의 열람·정정·삭제·처리정지, 동의 철회와 처리 결과에 대한 이의제기는 <a href={`mailto:${LEGAL_METADATA.privacyEmail}`}>{LEGAL_METADATA.privacyEmail}</a>로 요청할 수 있습니다. 이 주소로 보낸 메일은 Cloudflare Email Routing을 거쳐 Google의 Gmail에 저장되며, 세부 내용은 위 개인정보 문의 이메일 국외 처리 항목을 따릅니다. 명로는 본인 여부를 확인한 뒤 관련 법령에 따라 처리하고, 요청을 전부 또는 일부 받아들이기 어려운 경우에는 그 사유와 이의제기 방법을 안내합니다.</p>
      <p>
        개인정보 침해에 관한 별도 상담이나 분쟁조정이 필요한 경우 {" "}
        <a href="https://www.kopico.go.kr" rel="noreferrer" target="_blank">개인정보분쟁조정위원회</a>
        또는 {" "}
        <a href="https://privacy.kisa.or.kr" rel="noreferrer" target="_blank">개인정보침해 신고센터</a>
        를 이용할 수 있습니다.
      </p>
      <Heading>로그인 세션 쿠키</Heading>
      <p>명로는 로그인·가입 상태를 유지하기 위해 <code>MYEONGRO_SESSION</code> 쿠키를 자동으로 생성합니다. 이 쿠키에는 계정정보 자체가 아니라 서버의 세션을 찾기 위한 임의 식별값만 들어가며, 세션은 30분 동안 사용하지 않으면 만료됩니다. 운영 환경의 쿠키에는 HttpOnly, Secure와 SameSite=Lax 보호 설정을 적용합니다.</p>
      <p>브라우저 설정에서 쿠키 저장을 거부하거나 기존 쿠키를 삭제할 수 있습니다. 다만 이 경우 로그인, 가입, AI 리딩 생성과 저장 기록 조회 등 인증이 필요한 기능을 이용할 수 없습니다. 명로는 광고 또는 행태 추적 쿠키를 사용하지 않으며, 무료 오늘의 카드 값은 쿠키가 아닌 현재 브라우저 저장소에만 보관합니다.</p>
      <Heading>개인정보 보호책임자와 문의처</Heading>
      <dl>
        <div><dt>개인정보 보호책임자</dt><dd>{LEGAL_METADATA.operatorName}</dd></div>
        <div><dt>문의·권리행사</dt><dd><a href={`mailto:${LEGAL_METADATA.privacyEmail}`}>{LEGAL_METADATA.privacyEmail}</a></dd></div>
      </dl>
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

function PrivacyInquiryEmailOverseasDetails({
  headingLevel,
}: {
  headingLevel: "h2" | "h3";
}) {
  const Heading = headingLevel;
  const { processors } = PRIVACY_INQUIRY_EMAIL_PROCESSING;

  return (
    <>
      <Heading>개인정보 문의 이메일 국외 처리</Heading>
      <p>
        개인정보 문의와 권리행사 메일은 미국 소재 Cloudflare와 Google의 서비스를 통해
        국외에서 처리될 수 있습니다. 이 처리는 이용자가 요청한 문의·권리행사 처리에
        필요한 위탁·보관으로, 개인정보 보호법 제28조의8 제1항 제3호 가목에 따라 이
        처리방침으로 공개합니다.
      </p>
      <dl>
        <div><dt>처리 항목</dt><dd>{PRIVACY_INQUIRY_EMAIL_PROCESSING.items}</dd></div>
        <div><dt>시기·방법</dt><dd>{PRIVACY_INQUIRY_EMAIL_PROCESSING.method}</dd></div>
        <div><dt>명로 보유기간</dt><dd>{PRIVACY_INQUIRY_EMAIL_PROCESSING.operatorRetention}</dd></div>
        <div><dt>거부 방법·절차</dt><dd>{PRIVACY_INQUIRY_EMAIL_PROCESSING.refusalMethod}</dd></div>
        <div><dt>거부 효과</dt><dd>{PRIVACY_INQUIRY_EMAIL_PROCESSING.refusalEffect}</dd></div>
      </dl>
      <p><strong>Cloudflare Email Routing</strong></p>
      <dl>
        <div><dt>수탁자</dt><dd>{processors.cloudflare.name}</dd></div>
        <div><dt>주소·연락처</dt><dd>{processors.cloudflare.address} · {processors.cloudflare.contact}</dd></div>
        <div><dt>처리 국가</dt><dd>{processors.cloudflare.country}</dd></div>
        <div><dt>처리 목적</dt><dd>{processors.cloudflare.purpose}</dd></div>
        <div><dt>보유·이용 기간</dt><dd>{processors.cloudflare.retention}</dd></div>
      </dl>
      <p>
        Cloudflare Email Routing의 처리 방식·보유기간과 참여 사업자는 {" "}
        <a href={processors.cloudflare.sourceUrls.routing} rel="noreferrer" target="_blank">서비스 설명</a>, {" "}
        <a href={processors.cloudflare.sourceUrls.retention} rel="noreferrer" target="_blank">로그 보유기간</a>, {" "}
        <a href={processors.cloudflare.sourceUrls.subprocessors} rel="noreferrer" target="_blank">하위처리자 목록</a>
        에서 확인할 수 있습니다.
      </p>
      <p><strong>개인 Gmail</strong></p>
      <dl>
        <div><dt>수탁자</dt><dd>{processors.google.name}</dd></div>
        <div><dt>주소</dt><dd>{processors.google.address}</dd></div>
        <div><dt>개인정보 문의</dt><dd><a href={processors.google.contactUrl} rel="noreferrer" target="_blank">Google 개인정보 보호 문의</a></dd></div>
        <div><dt>처리 국가</dt><dd>{processors.google.country}</dd></div>
        <div><dt>처리 목적</dt><dd>{processors.google.purpose}</dd></div>
        <div><dt>보유·이용 기간</dt><dd>{processors.google.retention}</dd></div>
      </dl>
      <p>
        Google의 서비스 제공 법인·글로벌 처리와 삭제 절차는 {" "}
        <a href={processors.google.sourceUrls.terms} rel="noreferrer" target="_blank">Google 서비스 약관</a>, {" "}
        <a href={processors.google.sourceUrls.privacy} rel="noreferrer" target="_blank">개인정보처리방침</a>, {" "}
        <a href={processors.google.sourceUrls.retention} rel="noreferrer" target="_blank">데이터 보유기간 안내</a>
        에서 확인할 수 있습니다. 최종 확인일은 {PRIVACY_INQUIRY_EMAIL_PROCESSING.verifiedAt}입니다.
      </p>
    </>
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
