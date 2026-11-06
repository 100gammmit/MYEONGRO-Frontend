import { publicPageMetadata } from "@/infrastructure/site-metadata";
import { DailyCardExperience } from "@/components/daily-card-experience";
import type { DailyCardStorageScope } from "@/domain/daily-card-free";
import { deriveDailyCardUserScope } from "@/domain/daily-card-free/account-scope.server";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

export const metadata = publicPageMetadata(
  "/tarot/daily",
  "로그인 없이 무료 오늘의 카드 | 명로",
  "미리 작성한 정적 콘텐츠로 카드 한 장의 흐름을 살펴보세요. 실시간 AI 생성이나 크레딧 사용 없이 이용합니다.",
);

export default async function DailyTarotPage() {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  const storageScope: DailyCardStorageScope | null = session.status === "authenticated"
    ? deriveDailyCardUserScope(session.user.id)
    : session.status === "unauthenticated"
      ? "guest"
      : null;

  return <DailyCardExperience storageScope={storageScope} />;
}
