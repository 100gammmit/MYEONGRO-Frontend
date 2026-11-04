import { describe, expect, it } from "vitest";
import { annualCalendar, parseSajuAnnualReadingView } from "./annual-result";
import { annualFixture, annualView } from "./annual-fixture.test-helper";
import { parseSajuReadingCreateRequest } from "./schema";
import fullPreview from "../../../scripts/fixtures/saju-annual-full.json";
import briefPreview from "../../../scripts/fixtures/saju-annual-brief.json";

describe("annual report contract", () => {
  it("accepts the approved synthetic real Preview results as persisted v7 records", () => {
    expect(parseSajuAnnualReadingView(fullPreview)?.result.detailLevel).toBe("full");
    expect(parseSajuAnnualReadingView(briefPreview)?.result.detailLevel).toBe("brief");
  });
  it("restores full and brief reports without birth input", () => {
    expect(annualView().result.periods).toHaveLength(13);
    expect(annualView(true).result.periods).toHaveLength(0);
    const calendar = annualCalendar(annualView().input.calculationSnapshot.monthlyCalendar);
    expect(calendar.months[0].periodIds[1]).toBe(calendar.months[1].periodIds[0]);
    expect(JSON.stringify(annualView().input)).not.toMatch(/birthDate|birthTime|provinceCode/);
  });
  it.each(["missing month", "wrong evidence", "duplicate evidence", "year", "detail", "missing period", "raw input"])("rejects %s", (scenario) => {
    const value = annualFixture();
    if (scenario === "missing month") value.result.months.pop();
    if (scenario === "wrong evidence") value.result.months[0].evidenceKeys.push("monthlyFlow.p13");
    if (scenario === "duplicate evidence") value.result.months[0].evidenceKeys.push(value.result.months[0].evidenceKeys[0]);
    if (scenario === "year") value.result.targetYear = 2028;
    if (scenario === "detail") value.result.detailLevel = "brief";
    if (scenario === "missing period") value.result.periods.pop();
    if (scenario === "raw input") Object.assign(value.input, { birthDate: "1992-08-17" });
    expect(parseSajuAnnualReadingView(value)).toBeNull();
  });
  it("only annual reports allow an absent or blank question", () => {
    const request = { reportType: "annual_monthly", requestId: "82ed11d5-2269-438c-9815-42e6f13735f4", focusArea: "self", birthProfile: { calendarType: "solar", birthDate: "1992-08-17", birthTimePrecision: "unknown", luckDirectionBasis: "unspecified" } };
    expect(parseSajuReadingCreateRequest(request).question).toBeUndefined();
    expect(parseSajuReadingCreateRequest({ ...request, question: "  " }).question).toBe("");
    expect(() => parseSajuReadingCreateRequest({ ...request, reportType: "birth_annual_question" })).toThrow();
  });
});
