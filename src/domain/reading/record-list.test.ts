import { describe, expect, it } from "vitest";

import type { PublicReadingRecord } from "@/infrastructure/backend/reading-records-client";

import {
  formatRecordDay,
  getRecordRowMeta,
  getRecordRowState,
  groupRecordsByMonth,
  isSupportedRecord,
  parseRecordKindFilter,
} from "./record-list";

function record(overrides: Partial<PublicReadingRecord> = {}): PublicReadingRecord {
  return {
    id: "reading-1",
    kind: "tarot",
    spreadType: "mind_three_card",
    schemaVersion: 2,
    status: "completed",
    title: "꾸준함보다 리듬을 찾는 달",
    input: {},
    createdAt: "2026-11-12T03:00:00.000Z",
    updatedAt: "2026-11-12T03:00:00.000Z",
    ...overrides,
  };
}

const declinedResult = {
  resultType: "declined",
  reasonCode: "MEDICAL_DECISION",
  title: "이 질문에는 리딩을 제공할 수 없어요",
  message: "전문가와 상의해 주세요.",
  guidance: ["질문을 바꿔 보세요."],
  disclaimer: "의료 조언을 대신하지 않습니다.",
};

describe("record list rules", () => {
  it("names what happened to a record that did not become a reading and mutes the failures", () => {
    expect(getRecordRowState(record())).toEqual({ title: "꾸준함보다 리듬을 찾는 달", muted: false });
    expect(getRecordRowState(record({ status: "generating" }))).toEqual({ title: "생성 중", muted: false });
    expect(getRecordRowState(record({ status: "failed", errorCode: "GENERATION_TIMEOUT" })))
      .toEqual({ title: "생성 실패 - 시간 초과", muted: true });
    expect(getRecordRowState(record({ status: "failed", errorCode: "OPENAI_READING_GENERATION_FAILED" })).title)
      .toBe("생성 실패 - AI 응답 오류");
    for (const errorCode of ["READING_GENERATION_FAILED", "", "constructor", undefined]) {
      expect(getRecordRowState(record({ status: "failed", errorCode })).title).toBe("생성 실패 - 일시적 오류");
    }
    expect(getRecordRowState(record({ result: declinedResult })))
      .toEqual({ title: "리딩 불가 - 민감 질문", muted: true });
  });

  it("describes each record by its reading type and size", () => {
    expect(getRecordRowMeta(record())).toEqual({ kind: "고민 리딩", detail: "카드 3장" });
    expect(getRecordRowMeta(record({ spreadType: "choice_five_card" })))
      .toEqual({ kind: "선택 리딩", detail: "카드 5장" });
    expect(getRecordRowMeta(record({ kind: "saju", spreadType: null, input: { targetYear: 2026 } })))
      .toEqual({ kind: "AI 사주", detail: "2026년" });
    expect(getRecordRowMeta(record({
      kind: "saju",
      spreadType: null,
      schemaVersion: 7,
      input: { targetYear: 2027, reportType: "annual_monthly" },
    }))).toEqual({ kind: "한 해 리포트", detail: "2027년" });
  });

  it("keeps saju and AI tarot records but drops the old daily card records", () => {
    expect(isSupportedRecord(record())).toBe(true);
    expect(isSupportedRecord(record({ kind: "saju", spreadType: null }))).toBe(true);
    expect(isSupportedRecord(record({ spreadType: "daily_one_card" }))).toBe(false);
    expect(isSupportedRecord(record({ spreadType: "unknown" }))).toBe(false);
  });

  it("reads the kind filter from the address and falls back to all", () => {
    expect(parseRecordKindFilter("tarot")).toBe("tarot");
    expect(parseRecordKindFilter(["saju", "tarot"])).toBe("saju");
    expect(parseRecordKindFilter("daily")).toBe("all");
    expect(parseRecordKindFilter(undefined)).toBe("all");
  });

  it("groups by month and dates in Korean time", () => {
    // 2026-10-31 20:00 UTC is already 1 November in Korea.
    const groups = groupRecordsByMonth([
      record({ id: "a", createdAt: "2026-11-12T03:00:00.000Z" }),
      record({ id: "b", createdAt: "2026-10-31T20:00:00.000Z" }),
      record({ id: "c", createdAt: "2026-10-30T03:00:00.000Z" }),
      record({ id: "d", createdAt: "2026-11-02T03:00:00.000Z" }),
    ]);
    expect(groups.map((group) => [group.month, group.readings.map((reading) => reading.id)])).toEqual([
      ["2026년 11월", ["a", "b", "d"]],
      ["2026년 10월", ["c"]],
    ]);
    expect(formatRecordDay("2026-10-31T20:00:00.000Z")).toBe("11. 1.");
  });
});
