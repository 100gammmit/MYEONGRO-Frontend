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
  {
    id: "2026-11-20-manseryeok",
    category: "release", noticeLevel: "routine",
    title: "무료 만세력을 추가했습니다",
    summary: "로그인 없이 생년월일과 태어난 시각으로 사주 명식을 확인할 수 있습니다.",
    changes: [
      "만세력에서 본 명식 그대로 AI 사주 풀이로 이어갈 수 있습니다.",
      "AI 사주도 만세력과 같은 기준으로 계산하고, 출생 시·군·구와 계산 방식을 고를 수 있습니다.",
      "출생시각을 대략만 아는 경우 시 단위로 고르면 됩니다.",
    ],
    publishedDate: "2026-11-20", effectiveDate: "2026-11-20",
    links: [{ href: "/manseryeok", label: "무료 만세력 보기" }],
  },
]);
