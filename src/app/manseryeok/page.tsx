import { ManseryeokExperience } from "@/components/manseryeok/manseryeok-experience";
import { toBackendUrl } from "@/infrastructure/backend/url";
import { publicPageMetadata } from "@/infrastructure/site-metadata";

export const metadata = publicPageMetadata(
  "/manseryeok",
  "무료 만세력: 사주 명식·대운·세운·월운 계산 | 명로",
  "로그인 없이 생년월일과 태어난 시각으로 사주 명식표, 오행과 관계, 대운, 세운 10년, 올해·내년 월운을 계산해요. 입력한 정보는 저장하지 않아요.",
);

// The browser calls the public API domain itself; only the address is passed down, never a secret.
export default function ManseryeokPage() {
  return (
    <ManseryeokExperience
      birthPlacesEndpoint={toBackendUrl("/api/saju/calculations/birth-places")}
      calculateEndpoint={toBackendUrl("/api/saju/calculations")}
    />
  );
}
