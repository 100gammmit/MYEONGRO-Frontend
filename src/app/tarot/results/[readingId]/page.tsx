import { notFound } from "next/navigation";

import { TarotReadingResult } from "@/components/tarot-reading-result";
import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import { ReadingDeclinedResult } from "@/components/reading-declined-result";
import { parseDeclinedReadingView } from "@/domain/reading/declined-result";
import {
  TAROT_SPREADS,
  isAiTarotSpreadType,
  type TarotSpreadType,
} from "@/domain/tarot";
import { parseTarotResultView } from "@/domain/tarot/result-view";
import {
  BackendReadingRecordsClient,
  type PublicReadingRecord,
} from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

export default async function TarotResultPage({
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
  const supportedTarotReading = reading?.kind === "tarot"
    && typeof reading.spreadType === "string"
    && reading.spreadType in TAROT_SPREADS
    && isAiTarotSpreadType(reading.spreadType as TarotSpreadType);
  const declinedView = supportedTarotReading
    ? parseDeclinedReadingView(reading, "tarot")
    : null;
  if (declinedView) {
    return (
      <ReadingDeclinedResult
        backHref="/tarot"
        backLabel="타로 리딩"
        view={declinedView}
      />
    );
  }
  const view = reading ? parseTarotResultView(reading) : null;
  if (!view) notFound();

  return <TarotReadingResult {...view} />;
}
