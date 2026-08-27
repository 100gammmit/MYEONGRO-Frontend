import { DailyCardExperience } from "@/components/daily-card-experience";
import type { DailyCardStorageScope } from "@/domain/daily-card-free";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

export default async function DailyTarotPage() {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  const storageScope: DailyCardStorageScope = session.status === "authenticated"
    ? `user:${session.user.id}`
    : session.status === "unauthenticated"
      ? "guest"
      : "unavailable";

  return <DailyCardExperience storageScope={storageScope} />;
}
