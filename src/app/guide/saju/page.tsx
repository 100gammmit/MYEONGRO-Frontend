import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { ReadingGuidePage } from "@/components/reading-guide-page";
import { SAJU_GUIDE } from "@/content/reading-help";

export const metadata = publicPageMetadata(
  "/guide/saju",
  "사주 사용 가이드 | 명로",
  "질문과 출생정보를 준비하고 계산의 범위와 해석의 의미를 구분해 읽는 방법을 안내합니다.",
);

export default function SajuGuidePage() {
  return <ReadingGuidePage guide={SAJU_GUIDE} />;
}
