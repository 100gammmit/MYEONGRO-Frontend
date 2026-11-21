import { SHARE_IMAGE_SIZE, zodiacShareImage } from "@/app/zodiac/share-image";
import { TEN_GOD_SLUGS, getTenGod } from "@/domain/saju-dictionary";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "사주 개념 사전 · 십성";

export function generateStaticParams() {
  return TEN_GOD_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getTenGod((await params).slug);
  return zodiacShareImage({
    kicker: "사주 개념 사전 · 십성",
    title: entry ? `${entry.name}(${entry.hanja})` : "십성",
    summary: entry?.lead ?? "",
  });
}
