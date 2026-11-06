import { ReadingGuidePage } from "@/components/reading-guide-page";
import { TAROT_READING_EXAMPLE } from "@/content/public-reading-articles";
import { publicPageMetadata } from "@/infrastructure/site-metadata";

export const metadata = publicPageMetadata(
  "/guide/tarot/example", `${TAROT_READING_EXAMPLE.title} | 명로`, TAROT_READING_EXAMPLE.description,
);

export default function TarotExamplePage() {
  return <ReadingGuidePage guide={TAROT_READING_EXAMPLE} />;
}
