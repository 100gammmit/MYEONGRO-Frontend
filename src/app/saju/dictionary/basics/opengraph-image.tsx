import { SHARE_IMAGE_SIZE, zodiacShareImage } from "@/app/zodiac/share-image";
import { BASICS } from "@/domain/saju-dictionary";

export const size = SHARE_IMAGE_SIZE;
export const contentType = "image/png";
export const alt = "사주 읽기 기초";

export default function Image() {
  return zodiacShareImage({ kicker: "사주 개념 사전", title: BASICS.title, summary: BASICS.lead });
}
