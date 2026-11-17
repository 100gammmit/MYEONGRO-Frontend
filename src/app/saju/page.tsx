import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { SajuExperience } from "@/components/saju-experience";

export const metadata = publicPageMetadata(
  "/saju",
  "AI 사주: 종합 사주와 한 해 리포트 | 명로",
  "서버가 계산한 명식을 바탕으로 종합 사주 또는 올해·내년의 한 해 리포트를 살펴보세요.",
);

interface SajuPageProps {
  searchParams: Promise<{ report?: string | string[] }>;
}

// Only ?report=annual is recognised; any other value opens the default 종합 사주 choice.
export default async function SajuPage({ searchParams }: SajuPageProps) {
  const { report } = await searchParams;
  return <SajuExperience initialReportType={report === "annual" ? "annual_monthly" : "birth_annual_question"} />;
}
