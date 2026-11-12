import { TAROT_SPREADS, isAiTarotSpreadType, type TarotSpreadType } from "@/domain/tarot";
import type { PublicReadingRecord, ReadingKind } from "@/infrastructure/backend/reading-records-client";

import { parseDeclinedReadingView } from "./declined-result";

export type RecordKindFilter = "all" | ReadingKind;

const RECORD_KIND_FILTERS: readonly RecordKindFilter[] = ["all", "tarot", "saju"];

// Failure codes the backend stores on a generation record; anything else reads as a passing error.
const FAILURE_REASONS: ReadonlyMap<string, string> = new Map([
  ["GENERATION_TIMEOUT", "시간 초과"],
  ["OPENAI_READING_GENERATION_FAILED", "AI 응답 오류"],
]);
const DEFAULT_FAILURE_REASON = "일시적 오류";

// Records are stored as UTC instants but read in Korea, the same rule as formatReadingDate.
const RECORD_MONTH = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  timeZone: "Asia/Seoul",
});
const RECORD_DAY = new Intl.DateTimeFormat("ko-KR", {
  month: "numeric",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

/** Month and day only, since each row already sits under its month heading. */
export function formatRecordDay(isoInstant: string): string {
  return RECORD_DAY.format(new Date(isoInstant));
}

function tarotSpread(reading: PublicReadingRecord) {
  return reading.kind === "tarot"
    && typeof reading.spreadType === "string"
    && Object.hasOwn(TAROT_SPREADS, reading.spreadType)
    ? TAROT_SPREADS[reading.spreadType as TarotSpreadType]
    : null;
}

export function isSupportedRecord(reading: PublicReadingRecord): boolean {
  if (reading.kind === "saju") return true;
  const spread = tarotSpread(reading);
  return spread !== null && isAiTarotSpreadType(spread.id);
}

export function parseRecordKindFilter(value: string | string[] | undefined): RecordKindFilter {
  const raw = Array.isArray(value) ? value[0] : value;
  return RECORD_KIND_FILTERS.find((filter) => filter === raw) ?? "all";
}

// A record that did not become a reading says why in its own title, so the row needs no extra tag.
export function getRecordRowState(reading: PublicReadingRecord): { title: string; muted: boolean } {
  if (reading.status === "generating") return { title: "생성 중", muted: false };
  if (reading.status === "failed") {
    const reason = FAILURE_REASONS.get(reading.errorCode ?? "") ?? DEFAULT_FAILURE_REASON;
    return { title: `생성 실패 - ${reason}`, muted: true };
  }
  if (parseDeclinedReadingView(reading) !== null) return { title: "리딩 불가 - 민감 질문", muted: true };
  return { title: reading.title, muted: false };
}

export function getRecordRowMeta(reading: PublicReadingRecord): { kind: string; detail: string | null } {
  const spread = tarotSpread(reading);
  if (spread) return { kind: spread.name, detail: `카드 ${spread.cardCount}장` };
  if (reading.kind === "tarot") return { kind: "AI 타로", detail: null };

  const isAnnualReport = reading.schemaVersion === 7 && reading.input.reportType === "annual_monthly";
  const targetYear = typeof reading.input.targetYear === "number" ? `${reading.input.targetYear}년` : null;
  return { kind: isAnnualReport ? "한 해 리포트" : "AI 사주", detail: targetYear };
}

export function groupRecordsByMonth(
  readings: readonly PublicReadingRecord[],
): { month: string; readings: PublicReadingRecord[] }[] {
  const groups = new Map<string, PublicReadingRecord[]>();
  for (const reading of readings) {
    const month = RECORD_MONTH.format(new Date(reading.createdAt));
    groups.set(month, [...(groups.get(month) ?? []), reading]);
  }
  return [...groups].map(([month, monthReadings]) => ({ month, readings: monthReadings }));
}
