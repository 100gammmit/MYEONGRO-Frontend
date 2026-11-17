import { defineServiceUpdates } from "./model";

// Published entries are append-only. Correct a meaningful change by adding a new
// entry with correctionOf rather than rewriting what users were shown.
export const SERVICE_UPDATES = defineServiceUpdates([
  {
    id: "2026-11-18-zodiac-fortune",
    category: "release", noticeLevel: "routine",
    title: "2027 띠별 신년운세를 추가했습니다",
    summary: "로그인 없이 무료로 내 띠의 2027년을 읽어 볼 수 있습니다.",
    changes: ["태어난 해만 고르면 내 띠를 찾아 드립니다."],
    publishedDate: "2026-11-18", effectiveDate: "2026-11-18",
    links: [{ href: "/zodiac", label: "띠별 신년운세 보기" }],
  },
]);
