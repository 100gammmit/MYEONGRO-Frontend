import { SHARE_IMAGE_SIZE, zodiacShareImage } from "@/app/zodiac/share-image";
import { ELEMENT_NAMES } from "@/domain/manseryeok/display";
import { ELEMENT_SLUGS, getElement } from "@/domain/saju-dictionary";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "사주 개념 사전 · 오행";

export function generateStaticParams() {
  return ELEMENT_SLUGS.map((slug) => ({ slug }));
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const entry = getElement((await params).slug);
  return zodiacShareImage({
    kicker: "사주 개념 사전 · 오행",
    title: entry ? `${ELEMENT_NAMES[entry.slug]}(${entry.hanja})` : "오행",
    summary: entry?.lead ?? "",
  });
}
