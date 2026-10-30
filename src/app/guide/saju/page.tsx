import type { Metadata } from "next";
import { ReadingGuidePage } from "@/components/reading-guide-page";
import { SAJU_GUIDE } from "@/content/reading-help";

export const metadata: Metadata = { title: "사주 사용 가이드 | 명로", description: SAJU_GUIDE.description };

export default function SajuGuidePage() {
  return <ReadingGuidePage guide={SAJU_GUIDE} />;
}
