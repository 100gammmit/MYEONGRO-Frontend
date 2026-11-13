import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { ConsentDocumentContent } from "@/components/consent-document-content";

export const metadata = publicPageMetadata(
  "/terms",
  "서비스 이용약관 | 명로",
  "명로의 이용 자격, AI 타로·사주와 크레딧, 기록 관리 및 서비스 이용 조건을 확인하세요.",
);

export default function TermsPage() {
  return (
    <article className="flow-page page-width legal">
      <h1>서비스 이용약관</h1>
      <ConsentDocumentContent documentType="terms" />
    </article>
  );
}
