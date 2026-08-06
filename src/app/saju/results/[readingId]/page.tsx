import { notFound } from "next/navigation";

import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import { SajuReadingResult } from "@/components/saju-reading-result";
import { parseSajuReadingView } from "@/domain/saju/result";
import {
  BackendReadingRecordsClient,
  type PublicReadingRecord,
} from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

export default async function SajuResultPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  if (session.status === "unavailable") return <ProtectedPageUnavailable />;
  if (session.status === "unauthenticated") notFound();

  const { readingId } = await params;
  let reading: PublicReadingRecord | null;
  try {
    reading = await new BackendReadingRecordsClient(cookieHeader).get(readingId);
  } catch {
    return <ProtectedPageUnavailable />;
  }
  const view = parseSajuReadingView(reading);
  if (!view) notFound();

  return <SajuReadingResult backHref="/saju" backLabel="사주 리딩" view={view} />;
}
