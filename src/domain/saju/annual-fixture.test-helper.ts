import { annualCalendar, parseSajuAnnualReadingView } from "./annual-result";

// Synthetic data only. Dates exercise display/restore contracts, not astronomical accuracy.
export function annualFixture(brief = false) {
  const stamp = (month: number, day: number) => `${month === 13 ? 2028 : 2027}-${String(month === 13 ? 1 : month).padStart(2, "0")}-${String(day).padStart(2, "0")}T00:00:00+09:00`;
  const monthlyCalendar = {
    calculationVersion: "saju-monthly-ko-v1" as const, timeZone: "Asia/Seoul" as const, targetYear: 2027,
    months: Array.from({ length: 12 }, (_, i) => ({ month: i + 1, periods: [
      { startInclusive: stamp(i + 1, 1), endExclusive: stamp(i + 1, 5), yearGanZhi: "丁未", monthGanZhi: `흐름${i}` },
      { startInclusive: stamp(i + 1, 5), endExclusive: stamp(i + 2, 1), yearGanZhi: "丁未", monthGanZhi: `흐름${i + 1}` },
    ] })),
  };
  const calendar = annualCalendar(monthlyCalendar);
  const section = { heading: "한 해의 흐름", body: "자신의 속도를 살펴보는 해입니다.", evidenceKeys: ["annualFlow"] };
  const value = {
    id: "annual-synthetic", kind: "saju", schemaVersion: 7, status: "completed",
    input: { reportType: "annual_monthly", targetYear: 2027, calculationSnapshot: {
      calculationVersion: "saju-ko-v4", engine: "lunar-java", engineVersion: "1.7.7", cityCatalogVersion: "kr-admin-v1", targetYear: 2027,
      pillars: { year: { ganZhi: "壬申" }, month: { ganZhi: "戊申" }, day: brief ? null : { ganZhi: "乙丑" }, time: null },
      ...(brief ? {} : { dayMaster: "乙" }), fiveElements: { wood: 1, fire: 0, earth: 2, metal: 2, water: 1 }, relations: [],
      annualFortune: { year: 2027, ganZhi: "丁未" }, limitations: ["TIME_PILLAR_UNCERTAIN"], uncertainty: { varyingFields: ["time"] }, monthlyCalendar,
    } },
    result: { reportType: "annual_monthly", detailLevel: brief ? "brief" : "full", targetYear: 2027, readingMode: "standard", questionRedirected: false,
      title: "나의 한 해", annualOverview: section,
      months: calendar.months.map((month) => ({ ...section, month: month.month, heading: `${month.month}월의 흐름`, evidenceKeys: [...new Set(month.periodIds.map((id) => `monthlyFlow.${id}`))] })),
      periods: brief ? [] : calendar.periods.map((period) => ({ ...section, periodId: period.id, body: `${period.id} 구간을 살펴봅니다.`, evidenceKeys: [`monthlyFlow.${period.id}`] })),
      questionReading: null, summary: "한 해를 자신의 속도로 읽어 보세요.", disclaimer: "오락과 자기 성찰을 위한 참고이며 전문 조언을 대신하지 않습니다.",
    },
  };
  return value;
}

export function annualView(brief = false) {
  const parsed = parseSajuAnnualReadingView(annualFixture(brief));
  if (!parsed) throw new Error("Invalid synthetic annual fixture");
  return parsed;
}
