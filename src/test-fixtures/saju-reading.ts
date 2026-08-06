import { parseSajuReadingView, type SajuReadingView } from "@/domain/saju/result";

export function sajuReadingRecord(overrides: Record<string, unknown> = {}) {
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
    spreadType: null,
    schemaVersion: 2,
    status: "completed",
    title: "변화를 준비하며 기준을 세우는 해",
    input: {
      question: "올해 이직을 준비해도 괜찮을까요?",
      focusArea: "career",
      birthProfile: {
        calendarType: "solar",
        birthDate: "1992-08-17",
        birthTimePrecision: "unknown",
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
        dayMaster: "임",
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
      title: "변화를 준비하며 기준을 세우는 해",
      summary: "가능성을 현실 정보와 함께 살펴보세요.",
      natalSections: [
        { id: "core", heading: "나를 움직이는 중심", body: "중심을 살펴봅니다.", evidenceKeys: ["dayMaster"] },
        { id: "strengths", heading: "강점과 균형점", body: "균형을 살펴봅니다.", evidenceKeys: ["elementBalance"] },
        { id: "relationship", heading: "관계를 맺는 방식", body: "관계를 살펴봅니다.", evidenceKeys: ["interactions"] },
        { id: "work", heading: "일하고 선택하는 방식", body: "선택을 살펴봅니다.", evidenceKeys: ["tenGods"] },
      ],
      annualReading: { year: 2026, heading: "2026년의 흐름", body: "연간 흐름입니다.", evidenceKeys: ["annualFlow"] },
      questionReading: { focusArea: "career", heading: "지금의 질문에 비춰보면", body: "작게 준비하세요.", evidenceKeys: ["dayMaster"] },
      guidance: ["채용 정보를 확인하세요.", "작은 준비부터 시작하세요."],
      disclaimer: "오락과 자기성찰을 위한 참고입니다.",
    },
    errorCode: null,
    createdAt: "2026-08-06T00:00:00Z",
    updatedAt: "2026-08-06T00:00:01Z",
    ...overrides,
  };
}
export function sajuReadingView(): SajuReadingView {
  const parsed = parseSajuReadingView(sajuReadingRecord());
  if (!parsed) throw new Error("Saju reading fixture is invalid");
  return parsed;
}
