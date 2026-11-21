import { SHARE_IMAGE_SIZE, zodiacShareImage } from "@/app/zodiac/share-image";
import { DICTIONARY } from "@/domain/saju-dictionary";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "사주 개념 사전";

export default function Image() {
  return zodiacShareImage({ kicker: "명로 사주 개념 사전", title: "십성과 오행, 하나씩", summary: DICTIONARY.hub.description });
}
