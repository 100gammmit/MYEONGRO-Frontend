import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { SajuExperience } from "@/components/saju-experience";

export const metadata = publicPageMetadata(
  "/saju",
  "AI 사주: 종합 사주와 한 해 리포트 | 명로",
  "서버가 계산한 명식을 바탕으로 종합 사주 또는 올해·내년의 한 해 리포트를 살펴보세요.",
);

export default function SajuPage() {
  return <SajuExperience />;
}
