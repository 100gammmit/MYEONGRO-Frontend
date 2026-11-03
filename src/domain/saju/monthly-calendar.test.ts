import { describe, expect, it } from "vitest";
import { getSajuCurrentYear, monthlyCalendarSchema } from "./monthly-calendar";
import { parseSajuReadingView } from "./result";
import { sajuReadingRecord } from "@/test-fixtures/saju-reading";
import { sajuMonthlyCalendarFixture } from "@/test-fixtures/saju-monthly-calendar";

function record() {
  const base = sajuReadingRecord();
  base.input.targetYear = 2027;
  base.input.calculationSnapshot.targetYear = 2027;
  base.input.calculationSnapshot.annualFortune.year = 2027;
  base.result.annualReading.year = 2027;
  return { ...base, schemaVersion: 6, input: { ...base.input, calculationSnapshot: {
    ...base.input.calculationSnapshot, monthlyCalendar: sajuMonthlyCalendarFixture(),
  } } };
}
describe("monthly calendar contract", () => {
  it("uses Korea's year even while the UTC year has not changed", () => {
    expect(getSajuCurrentYear(new Date("2026-12-31T14:59:59Z"))).toBe(2026);
    expect(getSajuCurrentYear(new Date("2026-12-31T15:00:00Z"))).toBe(2027);
  });
  it("accepts frozen v6 calendar data and keeps v5 records unchanged", () => {
    const value = record();
    const serialized = JSON.stringify(value);
    expect(parseSajuReadingView(JSON.parse(serialized))?.schemaVersion).toBe(6);
    expect(JSON.stringify(value)).toBe(serialized);
    expect(parseSajuReadingView(sajuReadingRecord())?.schemaVersion).toBe(5);
  });
  it("rejects mismatched years, missing months, gaps, out-of-order or private fields", () => {
    const changedYear = record();
    changedYear.input.calculationSnapshot.monthlyCalendar.targetYear = 2026;
    expect(parseSajuReadingView(changedYear)).toBeNull();
    const missingMonth = sajuMonthlyCalendarFixture();
    missingMonth.months.pop();
    expect(monthlyCalendarSchema.safeParse(missingMonth).success).toBe(false);
    const gap = sajuMonthlyCalendarFixture();
    gap.months[0].periods[1].startInclusive = "2027-01-07T00:00:00+09:00";
    expect(monthlyCalendarSchema.safeParse(gap).success).toBe(false);
    const reordered = sajuMonthlyCalendarFixture();
    reordered.months.reverse();
    expect(monthlyCalendarSchema.safeParse(reordered).success).toBe(false);
    const privateField = sajuMonthlyCalendarFixture();
    Object.assign(privateField.months[0].periods[0], { birthDate: "1992-08-17" });
    expect(monthlyCalendarSchema.safeParse(privateField).success).toBe(false);
    const uncertain = record();
    delete (uncertain.input.calculationSnapshot as { dayMaster?: string }).dayMaster;
    expect(parseSajuReadingView(uncertain)).toBeNull();
  });
});
