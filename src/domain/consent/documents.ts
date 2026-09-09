export const TERMS_DOCUMENT_VERSION = "2026-09-09";
export const PRIVACY_DOCUMENT_VERSION = "draft-2026-09-08";
export const AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION = "draft-2026-09-07";
export const SAJU_INPUT_DOCUMENT_VERSION = "draft-2026-09-07";

export type ConsentScope = "tarot" | "saju";

export type ConsentDocumentType =
  | "terms"
  | "ai-overseas-transfer"
  | "saju-input";

export const CONSENT_DOCUMENT_VERSIONS: Readonly<Record<ConsentDocumentType, string>> = {
  terms: TERMS_DOCUMENT_VERSION,
  "ai-overseas-transfer": AI_OVERSEAS_TRANSFER_DOCUMENT_VERSION,
  "saju-input": SAJU_INPUT_DOCUMENT_VERSION,
};

export const OPENAI_SUBPROCESSOR_COUNTRY_SNAPSHOT = [
  "대한민국",
  "미국",
  "영국",
  "아일랜드",
  "독일",
  "프랑스",
  "스웨덴",
  "핀란드",
  "노르웨이",
  "네덜란드",
  "스위스",
  "스페인",
  "이탈리아",
  "폴란드",
  "캐나다",
  "멕시코",
  "브라질",
  "남아프리카공화국",
  "아랍에미리트",
  "인도",
  "싱가포르",
  "말레이시아",
  "인도네시아",
  "필리핀",
  "일본",
  "호주",
] as const;

export const OPENAI_SUBPROCESSOR_LIST_URL =
  "https://openai.com/ko-KR/policies/sub-processor-list/";
