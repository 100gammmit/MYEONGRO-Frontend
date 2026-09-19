import { describe, expect, it } from "vitest";

import { parseSajuReadingView } from "./result";
import { sajuReadingRecord } from "@/test-fixtures/saju-reading";

function completedSajuRecord() {
  const pillar = {
    ganZhi: "임신",
    stem: "임",
    branch: "신",
    fiveElements: "수금",
    stemTenGod: "정인",
    branchTenGods: ["정관"],
  };
  return {
    id: "reading-1",
    kind: "saju",
    schemaVersion: 2,
    status: "completed",
    input: {
      question: "올해 이직을 준비해도 괜찮을까요?",
      focusArea: "career",
      birthProfile: {
        calendarType: "solar",
        birthDate: "1992-08-17",
        birthTimePrecision: "unknown",
        birthTime: undefined as string | undefined,
        provinceCode: "36",
        cityCode: "36110",
        luckDirectionBasis: "unspecified",
      },
      targetYear: 2026,
      calculationSnapshot: {
        calculationVersion: "saju-ko-v1",
        engine: "lunar-java",
        engineVersion: "1.7.7",
        cityCatalogVersion: "kr-admin-v1",
        targetYear: 2026,
        timeCorrection: null,
        pillars: { year: pillar, month: pillar, day: pillar, time: null },
        dayMaster: "임" as string | null,
        fiveElements: { wood: 1, fire: 0, earth: 3, metal: 2, water: 2 },
        relations: [{ type: "충", members: ["축", "미"] }],
        luckCycle: null,
        annualFortune: { year: 2026, ganZhi: "병오", stemTenGod: "상관" },
        limitations: ["BIRTH_TIME_UNKNOWN", "LUCK_DIRECTION_UNSPECIFIED"],
        uncertainty: {
          precision: "unknown",
          candidateCount: 1440,
          rangeStart: "1992-08-17T00:00",
          rangeEnd: "1992-08-17T23:59",
          varyingFields: ["pillars.time", "luckCycle"],
          candidateZoneOffsets: ["+09:00"],
        },
      },
    },
    result: {
      questionRedirected: false,
      title: "변화를 준비하며 기준을 세우는 해",
      summary: "가능성을 현실 정보와 함께 살펴보세요.",
      natalSections: [
        { id: "core", heading: "나를 움직이는 중심", body: "중심을 살펴봅니다.", evidenceKeys: ["dayMaster"] },
        { id: "strengths", heading: "강점과 균형점", body: "균형을 살펴봅니다.", evidenceKeys: ["elementBalance"] },
        { id: "relationship", heading: "관계를 맺는 방식", body: "관계를 살펴봅니다.", evidenceKeys: ["interactions"] },
        { id: "work", heading: "일하고 선택하는 방식", body: "선택을 살펴봅니다.", evidenceKeys: ["tenGods"] },
      ],
      annualReading: { year: 2026, heading: "2026년의 흐름", body: "연간 흐름입니다.", evidenceKeys: ["annualFlow"] },
      questionReading: { heading: "지금의 질문에 비춰보면", body: "작게 준비하세요.", evidenceKeys: ["dayMaster"] },
      guidance: ["채용 정보를 확인하세요.", "작은 준비부터 시작하세요."],
      disclaimer: "오락과 자기성찰을 위한 참고입니다.",
    },
  };
}

describe("parseSajuReadingView", () => {
	it("accepts the minimal v5 record and rejects forbidden persisted fields", () => {
		const minimal = sajuReadingRecord();
		expect(parseSajuReadingView(minimal)).not.toBeNull();

		const forbiddenBirthProfile = structuredClone(minimal);
		Object.assign(forbiddenBirthProfile.input, {
			birthProfile: { birthDate: "1992-08-17" },
		});
		expect(parseSajuReadingView(forbiddenBirthProfile)).toBeNull();

		const forbiddenFullLuck = structuredClone(minimal);
		Object.assign(forbiddenFullLuck.input.calculationSnapshot, {
			luckCycle: { periods: [] },
		});
		expect(parseSajuReadingView(forbiddenFullLuck)).toBeNull();

		const forbiddenPrecision = structuredClone(minimal);
		Object.assign(forbiddenPrecision.input.calculationSnapshot.uncertainty, {
			candidateCount: 1440,
		});
		expect(parseSajuReadingView(forbiddenPrecision)).toBeNull();
	});

  it("decodes a completed saju v2 record while preserving an absent time pillar", () => {
    const parsed = parseSajuReadingView(completedSajuRecord());

    expect(parsed?.input.calculationSnapshot.pillars.time).toBeNull();
    expect(parsed?.result.natalSections.map((section) => section.id)).toEqual([
      "core", "strengths", "relationship", "work",
    ]);
    expect(parsed?.result.readingMode).toBe("standard");
    expect(parsed?.result.questionReading).not.toHaveProperty("focusArea");
  });

  it("rejects the removed duplicate focus area in question reading", () => {
    const legacyDuplicate = completedSajuRecord();
    Object.assign(legacyDuplicate.result.questionReading, { focusArea: "career" });

    expect(parseSajuReadingView(legacyDuplicate)).toBeNull();
  });

  it("rejects a redirected question in standard mode", () => {
    const invalid = completedSajuRecord();
    invalid.result.questionRedirected = true;

    expect(parseSajuReadingView(invalid)).toBeNull();
  });

  it("decodes a current v3 unknown-time record without a birth place", () => {
    const current = completedSajuRecord();
    current.schemaVersion = 3;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).provinceCode;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).cityCode;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).birthTime;
    current.input.calculationSnapshot.calculationVersion = "saju-ko-v3";
    current.input.calculationSnapshot.cityCatalogVersion = "kr-admin-v1-province";

    expect(parseSajuReadingView(current)).not.toBeNull();
  });

  it("decodes a current v4 record without a persisted question", () => {
    const current = completedSajuRecord();
    current.schemaVersion = 4;
    delete (current.input as Partial<typeof current.input>).question;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).provinceCode;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).cityCode;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).birthTime;
    current.input.calculationSnapshot.calculationVersion = "saju-ko-v3";
    current.input.calculationSnapshot.cityCatalogVersion = "kr-admin-v1-province";

    expect(parseSajuReadingView(current)).not.toBeNull();
  });

  it("decodes a migrated v2 exact-time profile as questionless v4", () => {
    const migrated = completedSajuRecord();
    migrated.schemaVersion = 4;
    migrated.input.birthProfile.birthTimePrecision = "exact";
    migrated.input.birthProfile.birthTime = "14:30";
    delete (migrated.input as Partial<typeof migrated.input>).question;
    delete (migrated.input.birthProfile as Partial<
      typeof migrated.input.birthProfile
    >).cityCode;

    expect(parseSajuReadingView(migrated)).not.toBeNull();
  });

  it("enforces the birth-place shape for each stored schema version", () => {
    const legacyWithoutCity = completedSajuRecord();
    delete (legacyWithoutCity.input.birthProfile as Partial<
      typeof legacyWithoutCity.input.birthProfile
    >).cityCode;
    expect(parseSajuReadingView(legacyWithoutCity)).toBeNull();

    const currentUnknownWithPlace = completedSajuRecord();
    currentUnknownWithPlace.schemaVersion = 3;
    expect(parseSajuReadingView(currentUnknownWithPlace)).toBeNull();

    const currentKnown = completedSajuRecord();
    currentKnown.schemaVersion = 3;
    currentKnown.input.birthProfile.birthTimePrecision = "exact";
    currentKnown.input.birthProfile.birthTime = "14:30";
    delete (currentKnown.input.birthProfile as Partial<
      typeof currentKnown.input.birthProfile
    >).cityCode;
    expect(parseSajuReadingView(currentKnown)).not.toBeNull();

    currentKnown.input.birthProfile.cityCode = "36110";
    expect(parseSajuReadingView(currentKnown)).toBeNull();
  });

  it("accepts one guidance item and rejects more than two", () => {
    const one = completedSajuRecord();
    one.result.guidance = ["오늘 할 수 있는 한 가지만 정하세요."];
    expect(parseSajuReadingView(one)).not.toBeNull();

    const three = completedSajuRecord();
    three.result.guidance = ["하나", "둘", "셋"];
    expect(parseSajuReadingView(three)).toBeNull();
  });

  it("rejects unsupported versions and mismatched result metadata", () => {
    expect(parseSajuReadingView({ ...completedSajuRecord(), schemaVersion: 1 })).toBeNull();
    const mismatched = completedSajuRecord();
    mismatched.result.annualReading.year = 2027;
    expect(parseSajuReadingView(mismatched)).toBeNull();
  });

  it("rejects current luck evidence when no luck cycle was calculated", () => {
    const value = completedSajuRecord();
    value.result.questionReading.evidenceKeys = ["currentLuckCycle"];

    expect(parseSajuReadingView(value)).toBeNull();
  });

  it("decodes an unknown-time record whose day pillar and ten gods differ across candidates", () => {
    const current = completedSajuRecord();
    current.schemaVersion = 4;
    delete (current.input as Partial<typeof current.input>).question;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).provinceCode;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).cityCode;
    delete (current.input.birthProfile as Partial<typeof current.input.birthProfile>).birthTime;
    const snapshot = current.input.calculationSnapshot;
    snapshot.calculationVersion = "saju-ko-v3";
    snapshot.cityCatalogVersion = "kr-admin-v1-province";
    const uncertainPillar = { ...snapshot.pillars.year, stemTenGod: null, branchTenGods: [] };
    Object.assign(snapshot, {
      pillars: { year: uncertainPillar, month: uncertainPillar, day: null, time: null },
      dayMaster: null,
      annualFortune: { year: 2026, ganZhi: "병오", stemTenGod: null },
      limitations: ["DAY_PILLAR_UNCERTAIN", "BIRTH_TIME_UNKNOWN", "TIME_PILLAR_UNCERTAIN"],
    });
    current.result.natalSections[0].evidenceKeys = ["pillars"];
    current.result.questionReading.evidenceKeys = ["uncertainty"];

    const parsed = parseSajuReadingView(current);

    expect(parsed?.input.calculationSnapshot.dayMaster).toBeNull();
    expect(parsed?.input.calculationSnapshot.annualFortune?.stemTenGod).toBeNull();
  });

  it("rejects inconsistent birth inputs", () => {
    const unknownWithTime = completedSajuRecord();
    unknownWithTime.input.birthProfile.birthTime = "12:30";
    expect(parseSajuReadingView(unknownWithTime)).toBeNull();

    const mismatchedPlace = completedSajuRecord();
    mismatchedPlace.input.birthProfile.cityCode = "11110";
    expect(parseSajuReadingView(mismatchedPlace)).toBeNull();
  });
});
