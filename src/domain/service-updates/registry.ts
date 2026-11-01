import { defineServiceUpdates } from "./model";

// Published entries are append-only. Correct a meaningful change by adding a new
// entry with correctionOf rather than rewriting what users were shown.
export const SERVICE_UPDATES = defineServiceUpdates([
  {
    id: "2026-10-31-abuse-limits",
    category: "policy",
    noticeLevel: "routine",
    title: "서비스 안정을 위해 요청 제한을 적용합니다",
    summary: "과도한 로그인 요청과 서비스 과부하를 막기 위한 제한을 추가했습니다.",
    changes: [
      "같은 네트워크에서 로그인 요청이 지나치게 많으면 잠시 이용이 제한될 수 있습니다.",
      "하루 리딩 생성량이 서비스 한도에 이르면 새 리딩 생성이 다음 날까지 제한될 수 있습니다.",
      "개인정보 처리방침에 요청 제한을 위한 IP 해시값 처리 항목을 추가했습니다. 해시값은 1분 뒤 삭제됩니다.",
      "이용 크레딧과 기존 리딩 기록은 바뀌지 않습니다.",
    ],
    publishedDate: "2026-10-31",
    effectiveDate: "2026-10-31",
    links: [{ href: "/privacy", label: "개인정보 처리방침" }],
  },
  {
    id: "2026-10-30-reading-help",
    category: "release",
    noticeLevel: "routine",
    title: "FAQ와 타로·사주 사용 가이드를 추가했습니다",
    summary: "로그인 없이 이용 안내와 질문 준비, 결과 읽는 방법을 확인할 수 있습니다.",
    changes: [
      "자주 묻는 질문에서 크레딧·기록·개인정보와 입력 관련 안내를 확인할 수 있습니다.",
      "타로와 사주 가이드에 각각의 진행 방법과 가상 질문 예시를 담았습니다.",
      "입력 화면의 가이드 링크는 새 탭으로 열려 작성 중인 화면을 유지합니다.",
      "리딩 생성 방식과 이용 크레딧, 개인정보 처리 범위는 바뀌지 않습니다.",
    ],
    publishedDate: "2026-10-30",
    effectiveDate: "2026-10-30",
    links: [
      { href: "/faq", label: "자주 묻는 질문" },
      { href: "/guide/tarot", label: "타로 사용 가이드" },
      { href: "/guide/saju", label: "사주 사용 가이드" },
    ],
  },
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
