import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { ConsentDocumentContent } from "@/components/consent-document-content";

export const metadata = publicPageMetadata(
  "/privacy",
  "개인정보 처리방침 | 명로",
  "명로의 개인정보 처리 항목과 보유기간, 외부 처리, 삭제·동의 철회 및 권리행사 방법을 확인하세요.",
);

export default function PrivacyPage() {
  return (
    <article className="simple-page legal page-width">
      <h1>개인정보 처리방침</h1>
      <ConsentDocumentContent documentType="privacy" />
    </article>
  );
}
