import type { Metadata } from "next";
import { ReadingGuidePage } from "@/components/reading-guide-page";
import { TAROT_GUIDE } from "@/content/reading-help";

export const metadata: Metadata = { title: "타로 사용 가이드 | 명로", description: TAROT_GUIDE.description };

export default function TarotGuidePage() {
  return <ReadingGuidePage guide={TAROT_GUIDE} />;
}
