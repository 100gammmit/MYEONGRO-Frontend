import { defineServiceUpdates } from "./model";

// Published entries are append-only. Correct a meaningful change by adding a new
// entry with correctionOf rather than rewriting what users were shown.
export const SERVICE_UPDATES = defineServiceUpdates([
  {
    id: "2026-10-25-reading-summary",
    category: "release",
    noticeLevel: "routine",
    title: "리딩의 마무리를 요약으로 모았어요",
    summary: "AI 타로와 사주의 답과 따뜻한 제안을 본문 뒤 요약에서 함께 읽을 수 있어요.",
    changes: [
      "정상 리딩의 별도 실천 가이드 영역을 없애고, 필요한 경우 요약에 부담 없는 제안을 덧붙여요.",
      "사주 리딩도 본문을 읽은 뒤 요약으로 마무리하도록 위치를 바꿨어요.",
      "기존 기록의 본문과 요약은 그대로이며, 예전 실천 가이드는 표시하지 않아요.",
      "거절 안내와 무료 오늘의 운세, 이용 크레딧은 바뀌지 않아요.",
    ],
    publishedDate: "2026-10-25",
    effectiveDate: "2026-10-25",
  },
  {
    id: "2026-10-06-three-card-reading",
    category: "release",
    noticeLevel: "routine",
    title: "3장 리딩에서 다음 전개를 읽어요",
    summary: "마음 정리가 고민 리딩으로 바뀌고, 관계 리딩도 앞으로의 관계를 살펴봐요.",
    changes: [
      "고민 리딩은 감정뿐 아니라 일·공부·창작·생활의 상황과 영향을 주는 요인, 다음 전개를 읽어요.",
      "관계 리딩은 내가 바라는 관계, 현재의 관계 흐름, 앞으로의 관계를 읽어요.",
      "기존 기록도 새 이름과 카드 위치 이름으로 표시하며, 저장된 리딩 본문은 바뀌지 않아요.",
      "리딩의 카드 수와 이용 크레딧은 그대로예요. 예측은 카드에 따른 해석이며 결과를 보장하지 않아요.",
    ],
    publishedDate: "2026-10-06",
    effectiveDate: "2026-10-06",
  },
]);
