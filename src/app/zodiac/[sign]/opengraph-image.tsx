import { ZODIAC_SLUGS, ZODIAC_YEAR_CONTENT as YEAR, getZodiacSign } from "@/domain/zodiac-fortune";

import { SHARE_IMAGE_SIZE, zodiacShareImage } from "../share-image";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = `${YEAR.year} 띠별 신년운세`;

export function generateStaticParams() {
  return ZODIAC_SLUGS.map((sign) => ({ sign }));
}

export default async function Image({ params }: { params: Promise<{ sign: string }> }) {
  const sign = getZodiacSign((await params).sign);
  return zodiacShareImage({
    kicker: `${YEAR.year} ${YEAR.yearName}`,
    title: sign ? `${sign.name} 신년운세` : "띠별 신년운세",
    summary: sign?.summary ?? YEAR.hub.summary[0],
  });
}
