import Link from "next/link";
import { notFound } from "next/navigation";

import { ReadingRecordActions } from "@/components/reading-record-actions";
import { ReadingDeclinedResult } from "@/components/reading-declined-result";
import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import { SajuReadingResult } from "@/components/saju-reading-result";
import { TarotReadingResult } from "@/components/tarot-reading-result";
import { parseSajuReadingView } from "@/domain/saju/result";
import { parseDeclinedReadingView } from "@/domain/reading/declined-result";
import { formatReadingDate } from "@/domain/reading/reading-date";
import {
  TAROT_SPREADS,
  isAiTarotSpreadType,
  type TarotSpreadType,
} from "@/domain/tarot";
import { parseTarotResultView } from "@/domain/tarot/result-view";
import { BackendReadingRecordsClient } from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

export default async function ReadingDetailPage({
  params,
}: {
  params: Promise<{ readingId: string }>;
}) {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  const { readingId } = await params;
  if (session.status === "unavailable") return <ProtectedPageUnavailable />;
  if (session.status === "unauthenticated") notFound();

  const reading = await new BackendReadingRecordsClient(cookieHeader).get(readingId);
  if (!reading) notFound();
  if (reading.kind === "tarot" && (
    typeof reading.spreadType !== "string"
    || !(reading.spreadType in TAROT_SPREADS)
    || !isAiTarotSpreadType(reading.spreadType as TarotSpreadType)
  )) notFound();

  const tarotView = parseTarotResultView(reading);
  const sajuView = parseSajuReadingView(reading);
  const declinedView = parseDeclinedReadingView(reading);
  const unreadableTarot = reading.kind === "tarot"
    && reading.status === "completed"
    && !tarotView;
  const unreadableSaju = reading.kind === "saju"
    && reading.status === "completed"
    && !sajuView;

  if (declinedView) {
    return (
      <ReadingDeclinedResult
        backHref="/records"
        backLabel="내 기록"
        footer={<ReadingRecordActions readingId={reading.id} />}
        view={declinedView}
      />
    );
  }

  if (sajuView) {
    return (
      <SajuReadingResult
        backHref="/records"
        backLabel="내 기록"
        footer={<ReadingRecordActions readingId={reading.id} />}
        view={sajuView}
      />
    );
  }

  // A saved tarot reading reopens exactly as its result screen did, with every card already turned.
  if (tarotView) {
    return (
      <TarotReadingResult
        {...tarotView}
        record={{
          backHref: "/records",
          backLabel: "내 기록",
          dateLabel: formatReadingDate(reading.createdAt),
          footer: <ReadingRecordActions readingId={reading.id} />,
        }}
      />
    );
  }

  return (
    <article className="simple-page page-width record-detail">
      <Link className="back-link" href="/records">
        ← 내 기록
      </Link>
      <p className="eyebrow">
        {reading.kind === "tarot" ? "AI TAROT" : "AI SAJU"}
      </p>

      {unreadableTarot || unreadableSaju ? (
        <div className="record-state" role="alert">
          <h1>이 리딩은 현재 형식으로 표시할 수 없어요</h1>
          <p>{unreadableTarot
            ? "저장된 타로 결과를 확인할 수 없어 지금은 표시할 수 없어요."
            : "저장된 사주 결과를 확인할 수 없어 지금은 표시할 수 없어요."}</p>
        </div>
      ) : reading.status === "failed" ? (
        <div className="record-state" role="alert">
          <h1>리딩 생성에 실패했어요</h1>
          <p>질문 원문은 저장하지 않아요. 질문 입력 화면에서 새 리딩을 시작해 주세요.</p>
          <Link className="primary-button" href={reading.kind === "saju" ? "/saju" : "/tarot"}>
            새 질문 입력하기
          </Link>
        </div>
      ) : (
        <div className="record-state" aria-live="polite">
          <h1>리딩을 생성하고 있어요</h1>
          <p>잠시 후 다시 확인해 주세요.</p>
        </div>
      )}

      <ReadingRecordActions
        readingId={reading.id}
      />
    </article>
  );
}
