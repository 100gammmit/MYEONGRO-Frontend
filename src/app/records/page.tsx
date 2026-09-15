import Link from "next/link";

import { ProtectedPageUnavailable } from "@/components/protected-page-unavailable";
import { formatReadingDate } from "@/domain/reading/reading-date";
import { TAROT_SPREADS, isAiTarotSpreadType, type TarotSpreadType } from "@/domain/tarot";
import {
  BackendReadingRecordsClient,
  type PublicReadingRecord,
} from "@/infrastructure/backend/reading-records-client";
import { getBackendCookieHeader } from "@/infrastructure/backend/request-cookies";
import { getSpringSessionState } from "@/infrastructure/backend/session-auth";

const statusLabels = {
  generating: "생성 중",
  completed: "완료",
  failed: "새 질문 필요",
} as const;

const SAJU_FOCUS_LABELS: Readonly<Record<string, string>> = {
  self: "나 자신",
  career: "직업·생활",
  relationship: "관계",
  life_money: "생활·금전",
};

function getReadingTypeLabel(kind: "tarot" | "saju", spreadType?: string | null): string {
  if (kind === "saju") return "AI 사주";
  if (spreadType && spreadType in TAROT_SPREADS) {
    return TAROT_SPREADS[spreadType as TarotSpreadType].name;
  }
  return "AI 타로";
}

function getRecordTitle(reading: PublicReadingRecord): string {
  if (reading.status === "completed") return reading.title;
  return reading.status === "generating" ? "리딩을 생성하고 있어요" : "완료하지 못한 리딩";
}

function getRecordContext(reading: PublicReadingRecord): string {
  if (reading.kind === "tarot" && reading.spreadType && reading.spreadType in TAROT_SPREADS) {
    return TAROT_SPREADS[reading.spreadType as TarotSpreadType].summary;
  }
  const focusArea = typeof reading.input.focusArea === "string"
    ? SAJU_FOCUS_LABELS[reading.input.focusArea]
    : null;
  const targetYear = typeof reading.input.targetYear === "number"
    ? `${reading.input.targetYear}년`
    : null;
  return [targetYear, focusArea].filter(Boolean).join(" · ") || "사주 리딩";
}

function isSupportedRecord(reading: PublicReadingRecord): boolean {
  if (reading.kind === "saju") return true;
  return typeof reading.spreadType === "string"
    && reading.spreadType in TAROT_SPREADS
    && isAiTarotSpreadType(reading.spreadType as TarotSpreadType);
}

export default async function RecordsPage() {
  const cookieHeader = await getBackendCookieHeader();
  const session = await getSpringSessionState(cookieHeader);
  if (session.status === "unavailable") return <ProtectedPageUnavailable />;

  const readings = session.status === "authenticated"
    ? await new BackendReadingRecordsClient(cookieHeader).list()
    : [];
  const supportedReadings = readings.filter(isSupportedRecord);

  return (
    <section className="simple-page page-width records-page">
      <p className="eyebrow">MY READINGS</p>
      <h1>나의 리딩 기록</h1>

      {supportedReadings.length === 0 ? (
        <div className="empty-state">
          <span>◇</span>
          <h2>아직 저장된 이야기가 없어요</h2>
          <p>타로와 사주 리딩을 완료하면 이곳에서 다시 볼 수 있어요.</p>
          <Link className="primary-button" href="/">
            첫 리딩 시작하기
          </Link>
        </div>
      ) : (
        <div className="records-list">
          {supportedReadings.map((reading) => (
            <Link
              className="record-card"
              href={`/records/${reading.id}`}
              key={reading.id}
            >
              <div>
                <span className="record-kind">
                  {getReadingTypeLabel(reading.kind, reading.spreadType)}
                </span>
                <h2>{getRecordTitle(reading)}</h2>
                <p>{getRecordContext(reading)}</p>
              </div>
              <div className="record-meta">
                <span className={`record-status ${reading.status}`}>
                  {statusLabels[reading.status]}
                </span>
                <time dateTime={reading.createdAt}>
                  {formatReadingDate(reading.createdAt)}
                </time>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
