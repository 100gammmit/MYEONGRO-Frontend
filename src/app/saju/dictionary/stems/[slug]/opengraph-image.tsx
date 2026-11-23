import { SHARE_IMAGE_SIZE, zodiacShareImage } from "@/app/zodiac/share-image";
import { STEM_SLUGS, getStem, stemFacts } from "@/domain/saju-dictionary";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "사주 개념 사전 · 천간";

export function generateStaticParams() {
  return STEM_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getStem((await params).slug);
  const glyph = entry ? stemFacts(entry.slug).glyph : null;
  return zodiacShareImage({
    kicker: "사주 개념 사전 · 천간",
    title: glyph ? `${glyph.korean}(${glyph.hanja})` : "천간",
    summary: entry?.lead ?? "",
  });
}
