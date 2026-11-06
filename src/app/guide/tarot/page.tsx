import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { ReadingGuidePage } from "@/components/reading-guide-page";
import { TAROT_GUIDE } from "@/content/reading-help";

export const metadata = publicPageMetadata(
  "/guide/tarot",
  "타로 사용 가이드 | 명로",
  "질문과 카드 선택을 준비하고 자리별 타로 해석과 요약을 읽는 방법을 안내합니다.",
);

export default function TarotGuidePage() {
  return <ReadingGuidePage guide={TAROT_GUIDE} />;
}
