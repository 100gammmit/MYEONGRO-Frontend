import { ConsentDocumentContent } from "@/components/consent-document-content";

export default function TermsPage() {
  return (
    <article className="simple-page legal page-width">
      <p className="eyebrow">TERMS</p>
      <h1>서비스 이용약관</h1>
      <ConsentDocumentContent documentType="terms" />
    </article>
  );
}
