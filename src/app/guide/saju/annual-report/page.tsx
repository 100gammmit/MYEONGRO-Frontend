import { ReadingGuidePage } from "@/components/reading-guide-page";
import { SAJU_ANNUAL_REPORT_GUIDE } from "@/content/public-reading-articles";
import { publicPageMetadata } from "@/infrastructure/site-metadata";

export const metadata = publicPageMetadata(
  "/guide/saju/annual-report", `${SAJU_ANNUAL_REPORT_GUIDE.title} | 명로`, SAJU_ANNUAL_REPORT_GUIDE.description,
);

export default function AnnualReportGuidePage() {
  return <ReadingGuidePage guide={SAJU_ANNUAL_REPORT_GUIDE} />;
}
