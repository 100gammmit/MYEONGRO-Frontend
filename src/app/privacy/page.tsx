import { ConsentDocumentContent } from "@/components/consent-document-content";

export default function PrivacyPage() {
  return (
    <article className="simple-page legal page-width">
      <p className="eyebrow">PRIVACY</p>
      <h1>개인정보 처리방침</h1>
      <ConsentDocumentContent documentType="privacy" />
    </article>
  );
}
