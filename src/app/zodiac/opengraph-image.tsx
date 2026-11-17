import { ZODIAC_YEAR_CONTENT as YEAR } from "@/domain/zodiac-fortune";

import { SHARE_IMAGE_SIZE, zodiacShareImage } from "./share-image";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = `${YEAR.year} 띠별 신년운세`;

export default function Image() {
  return zodiacShareImage({
    kicker: `${YEAR.year} ${YEAR.yearName}`,
    title: "띠별 신년운세",
    summary: YEAR.hub.summary[0],
  });
}
