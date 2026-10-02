export const TERMS_DOCUMENT_VERSION = "2026-09-27";
export const PRIVACY_DOCUMENT_VERSION = "2026-10-02";
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
    "대한민국(Backend·Redis·RDS·CloudWatch는 서울 리전 ap-northeast-2)",
  dynamicProcessingLocation:
    "이용자와 가까운 AWS CloudFront 엣지 로케이션 소재국 및 AWS가 공개한 서비스 제공 계열사·하위처리자 소재국",
  transferItems:
    "세션 식별자, 계정·크레딧·동의·리딩 정보, 요청 중 일시 처리되는 질문·선택지·관심 분야와 원본 출생정보, 최소 사주 계산정보, 서비스 요청·응답 및 최소 운영 로그",
  method:
    "서비스 이용 시 암호화된 네트워크를 통해 AWS 인프라로 전송·처리",
  retention:
    "요청 중계 정보는 요청 처리에 필요한 동안, 저장 정보는 위 처리 항목별 보유기간 동안 처리한 뒤 삭제",
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
