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
    id: "2026-11-21-manseryeok",
    category: "release", noticeLevel: "routine",
    title: "무료 만세력을 추가했습니다",
    summary: "로그인 없이 생년월일과 태어난 시각으로 사주 명식을 확인할 수 있습니다.",
    changes: [
      "만세력에서 본 명식 그대로 AI 사주 풀이로 이어갈 수 있습니다.",
      "AI 사주도 만세력과 같은 기준으로 계산하고, 출생 시·군·구와 계산 방식을 고를 수 있습니다.",
      "출생시각을 대략만 아는 경우 시 단위로 고르면 됩니다.",
    ],
    publishedDate: "2026-11-21", effectiveDate: "2026-11-21",
    links: [{ href: "/manseryeok", label: "무료 만세력 보기" }],
  },
  {
    id: "2026-11-22-saju-dictionary",
    category: "release", noticeLevel: "routine",
    title: "사주 개념 사전을 열었습니다",
    summary: "만세력에 나오는 십성과 오행이 무엇을 뜻하고 어떻게 정해지는지 정리했습니다.",
    changes: [
      "십성 열 가지와 오행 다섯 가지를 한 편씩 설명합니다.",
      "무료 만세력 결과에서 십성 이름이나 오행을 누르면 바로 해당 설명으로 이동합니다.",
    ],
    publishedDate: "2026-11-22", effectiveDate: "2026-11-22",
    links: [{ href: "/saju/dictionary", label: "사주 개념 사전 보기" }],
  },
  {
    id: "2026-11-25-saju-dictionary-stems-branches",
    category: "release", noticeLevel: "routine",
    title: "사주 개념 사전에 천간과 지지를 추가했습니다",
    summary: "명식의 위아래 글자인 천간 열 글자와 지지 열두 글자가 각각 무엇이고 어떻게 읽히는지 정리했습니다.",
    changes: [
      "글자마다 일간에 따라 달라지는 십성과 다른 글자와의 관계를 그림으로 보여 드립니다.",
      "무료 만세력 명식표에서 천간·지지 글자를 누르면 바로 해당 설명으로 이동합니다.",
      "띠별 신년운세에서 내 띠의 지지 설명으로 이어 볼 수 있습니다.",
    ],
    publishedDate: "2026-11-25", effectiveDate: "2026-11-25",
    links: [{ href: "/saju/dictionary", label: "사주 개념 사전 보기" }],
  },
]);
