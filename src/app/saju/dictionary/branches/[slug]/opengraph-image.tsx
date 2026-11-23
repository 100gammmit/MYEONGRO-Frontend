import { SHARE_IMAGE_SIZE, zodiacShareImage } from "@/app/zodiac/share-image";
import { BRANCH_SLUGS, branchFacts, getBranch } from "@/domain/saju-dictionary";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "사주 개념 사전 · 지지";

export function generateStaticParams() {
  return BRANCH_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getBranch((await params).slug);
  const glyph = entry ? branchFacts(entry.slug).glyph : null;
  return zodiacShareImage({
    kicker: "사주 개념 사전 · 지지",
    title: glyph ? `${glyph.korean}(${glyph.hanja})` : "지지",
    summary: entry?.lead ?? "",
  });
}
