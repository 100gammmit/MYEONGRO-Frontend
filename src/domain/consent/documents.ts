export const TERMS_DOCUMENT_VERSION = "2026-09-27";
export const PRIVACY_DOCUMENT_VERSION = "2026-11-01";
export const PRIVACY_DOCUMENT_EFFECTIVE_DATE = "2026-11-01";
export const AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION = "2026-09-25";

export const AWS_PROCESSING_DISCLOSURE = {
  verifiedAt: "2026-10-02",
  processor: {
    name: "Amazon Web Services Korea LLC",
    address: "대한민국 서울특별시 강남구 테헤란로 231, 센터필드 EAST 12층 (06142)",
    contact: "aws-korea-privacy@amazon.com",
  },
  sourceUrls: {
    contractingParty: "https://aws.amazon.com/legal/aws-contracting-party/",
    privacy: "https://aws.amazon.com/privacy/",
    subprocessors: "https://aws.amazon.com/compliance/sub-processors/",
    edgeLocations: "https://aws.amazon.com/cloudfront/features/",
  },
  outsourcedTasks:
    "Front 호스팅·콘텐츠 전송·API 요청 중계, Backend·세션·데이터베이스·자동 백업·운영 로그 인프라 제공",
  primaryProcessingLocation:
    "대한민국(Front 서버(Amplify)·Backend·Redis·RDS·CloudWatch는 서울 리전 ap-northeast-2)",
  dynamicProcessingLocation:
    "이용자와 가까운 AWS CloudFront 엣지 로케이션 소재국 및 AWS가 공개한 서비스 제공 계열사·하위처리자 소재국",
  transferItems:
    "세션 식별자, 계정·크레딧·동의·리딩 정보, 요청 중 일시 처리되는 질문·선택지·관심 분야와 원본 출생정보, 최소 사주 계산정보, 요청 제한용 IP 해시값, 서비스 요청·응답 및 최소 운영 로그",
  method:
    "서비스 이용 시 암호화된 네트워크를 통해 AWS 인프라로 전송·처리",
  retention:
    "요청 중계 정보는 요청 처리에 필요한 동안, 저장 정보는 위 처리 항목별 보유기간 동안 처리한 뒤 삭제",
  refusalMethod:
    "서비스 이용 전에는 접속을 중단하고, 이용 중에는 계정 설정에서 계정을 삭제하거나 개인정보 문의 이메일로 요청",
  refusalEffect:
    "AWS 인프라는 명로 서비스 제공에 필수이므로 국외 처리를 거부하면 명로의 웹 서비스 전체를 이용할 수 없음. 다만 개인정보 문의 이메일을 통한 권리행사와 계정 삭제 요청은 가능",
} as const;

export const PRIVACY_INQUIRY_EMAIL_PROCESSING = {
  verifiedAt: "2026-10-06",
  sourceUpdatedAt: "2026-07-23",
  address: "privacy@myeongro.com",
  items:
    "발신자 이름·이메일 주소, 메일 제목·본문·첨부파일, 수신 주소·메시지 식별자·메일 인증 및 전달 정보, 답변과 권리행사 처리 이력",
  operatorRetention:
    "문의 처리를 완료한 날부터 최대 30일 이내에 대화·첨부파일·답변 사본을 Workspace Gmail에서 영구 삭제. 법령상 보존 의무 또는 실제 진행 중인 분쟁 대응에 필요한 자료는 해당 사유가 끝날 때까지 필요한 범위에서 별도 보관한 뒤 삭제",
  method:
    "이용자가 개인정보 문의 메일을 보내거나 명로가 답변할 때 Google Workspace에서 직접 수신·저장·회신. Workspace 메일함 접속에는 HTTPS 암호화 통신을 사용하며 Cloudflare Email Routing과 개인 Gmail 전달은 사용하지 않음",
  refusalMethod:
    "메일 전송 전 발송을 중단하여 국외 처리를 거부하거나, 전송 후 privacy@myeongro.com으로 삭제 요청",
  refusalEffect:
    "메일 국외 처리를 거부하면 이메일을 통한 문의·권리행사는 처리할 수 없음. 서비스 화면에서 제공하는 리딩 삭제, 계정 삭제와 AI 국외이전 동의 철회 기능은 계속 이용 가능",
  processors: {
    google: {
      name: "Google Asia Pacific Pte. Ltd.",
      country: "싱가포르(직접 수탁자의 계약 법인 소재국). 실제 처리 가능 위치는 아래 역할별 국가 참조",
      address: "70 Pasir Panjang Road, #03-71, Mapletree Business City II Singapore 117371",
      contactUrl: "https://support.google.com/a/contact/googlecloud_dpr",
      purpose: "개인정보 문의 메일·첨부파일·답변 및 처리 이력의 수신·저장·열람·회신과 서비스 유지·보안",
      retention:
        "명로의 보관기간 종료 시 Gmail에서 영구 삭제. 휴지통에서 제거된 데이터에도 최대 25일의 관리자 복구 가능 기간이 있음. 고객이 복구할 수 없는 상태의 삭제 지시 후 Google은 원칙적으로 최대 180일 이내에 시스템에서 삭제하며 법령상 보존 예외가 있음. 명로는 보유기한이 끝난 문의를 통상적인 운영 목적으로 복구하지 않음",
      sourceUrls: {
        contractingParty: "https://cloud.google.com/terms/google-entity",
        cdpa: "https://cloud.google.com/terms/data-processing-addendum",
        subprocessors: "https://workspace.google.com/intl/en/terms/subprocessors/",
        dataCenters: "https://datacenters.google/locations/",
        recovery: "https://workspace.google.com/learn-more/security/security-whitepaper/data-recovery/",
      },
    },
  },
  // Country where processing is performed, not country of registration.
  // Core Services/Gmail only; AppSheet and Assured Support-only features excluded.
  // Data-center footprint additionally includes published, non-development locations.
  // Check detail-page status too: Canelones is in development despite the index label.
  processingRoles: [
    {
      id: "data-centers",
      role: "데이터센터 운영·저장 가능 위치",
      processors: "Google 계열사 및 Google 공개 데이터센터",
      countries: ["미국", "캐나다", "멕시코", "칠레", "벨기에", "덴마크", "핀란드", "독일", "아일랜드", "네덜란드", "영국", "일본", "싱가포르", "대만"],
      purpose: "메일 데이터 저장 인프라 운영·유지",
      condition: "공개 데이터센터와 Core Services 공통 데이터센터 운영 위치. 개발 중인 위치는 제외하며 데이터센터 운영 인력의 업무에는 고객 데이터 접근이 필요하지 않음",
    },
    {
      id: "maintenance",
      role: "서비스 유지보수",
      processors: "Google 계열사",
      countries: ["아르헨티나", "호주", "벨기에", "브라질", "캐나다", "칠레", "프랑스", "독일", "홍콩", "인도", "아일랜드", "이스라엘", "이탈리아", "일본", "대한민국", "멕시코", "네덜란드", "뉴질랜드", "폴란드", "싱가포르", "스페인", "스웨덴", "스위스", "대만", "영국", "미국"],
      purpose: "시스템 개발·유지보수 및 장애 해결",
      condition: "문제 해결에 필요한 경우 제한적이고 승인된 데이터 접근 가능",
    },
    {
      id: "support",
      role: "조건부 기술 지원",
      processors: "Google 계열사 및 공식 목록의 Core Services 공통 기술 지원 하위처리자",
      countries: ["아르헨티나", "호주", "벨기에", "브라질", "불가리아", "캐나다", "칠레", "콜롬비아", "엘살바도르", "프랑스", "독일", "홍콩", "인도", "아일랜드", "이스라엘", "이탈리아", "일본", "대한민국", "말레이시아", "멕시코", "네덜란드", "뉴질랜드", "필리핀", "폴란드", "루마니아", "싱가포르", "스페인", "스리랑카", "스웨덴", "스위스", "대만", "영국", "미국"],
      purpose: "고객이 요청한 기술 지원",
      condition: "지원 요청 시 적용 가능. 제3자 지원 사업자의 고객 데이터 접근은 고객이 지원 과정에서 명시적으로 허용한 경우로 제한",
    },
    {
      id: "security",
      role: "조건부 보안 위험 탐지",
      processors: "Wipro LLC 및 해당 계열사",
      countries: ["인도", "필리핀", "미국"],
      purpose: "계정 침해·오남용 징후 검토",
      condition: "침해·오남용이 의심되는 계정의 의심스러운 검색어에 한정한 검토",
    },
  ],
} as const;

export type ConsentScope = "tarot" | "saju";

export type ConsentDocumentType =
  | "terms"
  | "ai-overseas-transfer";

export const CONSENT_DOCUMENT_VERSIONS: Readonly<Record<ConsentDocumentType, string>> = {
  terms: TERMS_DOCUMENT_VERSION,
  "ai-overseas-transfer": AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
};

type OpenAiProcessor = {
  readonly name: string;
  readonly countries: readonly string[];
  readonly purpose: string;
  readonly condition?: string;
};

type OpenAiProcessorGroup = {
  readonly id: string;
  readonly label: string;
  readonly processors: readonly OpenAiProcessor[];
};

export const OPENAI_TRANSFER_SNAPSHOT = {
  sourceUpdatedAt: "2026-07-09",
  verifiedAt: "2026-09-25",
  sourceUrl: "https://openai.com/policies/sub-processor-list/",
  directRecipient: {
    name: "OpenAI OpCo, LLC",
    country: "미국",
    address: "1455 3rd Street, San Francisco, California 94158, United States",
    contact: "privacy@openai.com",
    purpose: "이용자가 요청한 AI 타로·사주 리딩 생성",
  },
  processorGroups: [
    {
      id: "openai-affiliates",
      label: "OpenAI 계열사",
      processors: [
        { name: "OpenAI, LLC", countries: ["미국"], purpose: "기술·운영 지원" },
        { name: "OpenAI Ireland Ltd.", countries: ["아일랜드"], purpose: "기술·운영 지원" },
        { name: "OpenAI UK Ltd.", countries: ["영국"], purpose: "기술·운영 지원" },
        { name: "OpenAI Japan Ltd.", countries: ["일본"], purpose: "기술·운영 지원" },
      ],
    },
    {
      id: "cloud-infrastructure",
      label: "API 클라우드 인프라",
      processors: [
        {
          name: "Microsoft Corporation",
          countries: [
            "호주", "브라질", "캐나다", "프랑스", "독일", "인도", "인도네시아",
            "아일랜드", "이탈리아", "일본", "멕시코", "네덜란드", "노르웨이",
            "폴란드", "싱가포르", "남아프리카공화국", "대한민국", "스페인",
            "스웨덴", "스위스", "아랍에미리트", "영국", "미국",
          ],
          purpose: "클라우드 인프라",
        },
        {
          name: "CoreWeave, Inc.",
          countries: ["노르웨이", "스페인", "스웨덴", "영국", "미국"],
          purpose: "클라우드 인프라",
        },
        {
          name: "Oracle Cloud Infrastructure",
          countries: ["브라질", "일본", "말레이시아", "네덜란드", "영국", "미국"],
          purpose: "클라우드 인프라",
        },
        {
          name: "Google Cloud Platform",
          countries: ["핀란드", "일본", "네덜란드", "노르웨이", "영국", "미국"],
          purpose: "클라우드 인프라",
        },
        { name: "Amazon Web Services, Inc.", countries: ["미국"], purpose: "클라우드 인프라" },
        { name: "Cerebras", countries: ["미국", "캐나다"], purpose: "클라우드 인프라" },
      ],
    },
    {
      id: "non-zdr-infrastructure",
      label: "ZDR 미적용 시 데이터·인프라 처리",
      processors: [
        {
          name: "Snowflake, Inc.",
          countries: ["미국"],
          purpose: "데이터 웨어하우징",
          condition: "Zero Data Retention을 사용하지 않는 API 요청에 적용될 수 있음",
        },
        {
          name: "Confluent",
          countries: ["미국"],
          purpose: "인프라 관리",
          condition: "Zero Data Retention을 사용하지 않는 API 요청에 적용될 수 있음",
        },
      ],
    },
    {
      id: "conditional-review-support",
      label: "조건부 콘텐츠 검토·고객지원",
      processors: [
        {
          name: "TaskUs, LLC",
          countries: ["필리핀"],
          purpose: "고객지원 및 콘텐츠 검토",
          condition: "지원 요청 또는 관련 콘텐츠가 안전 검토 대상으로 분류된 경우",
        },
        {
          name: "Intercom, Inc.",
          countries: ["미국"],
          purpose: "고객지원",
          condition: "고객지원 요청에서 해당 내용을 공유한 경우",
        },
        {
          name: "Salesforce",
          countries: [
            "호주", "브라질", "캐나다", "프랑스", "독일", "인도", "인도네시아",
            "아일랜드", "이탈리아", "일본", "싱가포르", "남아프리카공화국",
            "대한민국", "스웨덴", "스위스", "네덜란드", "아랍에미리트", "영국", "미국",
          ],
          purpose: "고객지원",
          condition: "고객지원 요청에서 해당 내용을 공유한 경우",
        },
        {
          name: "Pylon Labs",
          countries: ["미국"],
          purpose: "고객지원",
          condition: "고객이 선택한 프리미엄 지원에만 적용",
        },
        {
          name: "Accenture International Limited",
          countries: ["미국", "캐나다", "필리핀"],
          purpose: "고객지원 및 콘텐츠 검토",
          condition: "지원 요청 또는 관련 콘텐츠가 안전 검토 대상으로 분류된 경우",
        },
        {
          name: "Cinder Technologies, Inc.",
          countries: ["미국"],
          purpose: "콘텐츠 검토 플랫폼",
          condition: "ZDR을 사용하지 않고 관련 콘텐츠가 안전 검토 대상으로 분류된 경우",
        },
        {
          name: "Okta, Inc.",
          countries: ["미국"],
          purpose: "OpenAI 사용자 인증 서비스",
          condition: "OpenAI의 API 서비스 운영에 필요한 인증 처리에 적용",
        },
      ],
    },
  ] satisfies readonly OpenAiProcessorGroup[],
  dynamicProcessor: {
    name: "Cloudflare, Ltd.",
    purpose: "API 네트워크 전송과 콘텐츠 전송 네트워크",
    location: "최종 사용자와 가장 가까운 데이터센터 소재국",
  },
} as const;

export const OPENAI_PUBLISHED_PROCESSING_COUNTRIES = Array.from(new Set(
  OPENAI_TRANSFER_SNAPSHOT.processorGroups.flatMap((group) =>
    group.processors.flatMap((processor) => processor.countries),
  ),
));

export const OPENAI_DOMESTIC_PROCESSING_COUNTRIES = ["대한민국"] as const;

export const OPENAI_OVERSEAS_PROCESSING_COUNTRIES =
  OPENAI_PUBLISHED_PROCESSING_COUNTRIES.filter((country) => country !== "대한민국");
