import { describe, expect, it } from "vitest";

import fixture from "@/test-fixtures/manseryeok-chart.json";

import { parseManseryeokChart } from "./schema";

describe("manseryeok chart contract", () => {
  it("accepts a schema v1 chart with every section", () => {
    const chart = parseManseryeokChart(fixture);
    expect(chart?.chart.dayMaster?.hanja).toBe("甲");
    expect(chart?.monthlyCalendar.months).toHaveLength(12);
  });

  it("accepts the nulls an uncertain time leaves and rejects unknown fields", () => {
    const uncertain = structuredClone(fixture);
    Object.assign(uncertain.chart.pillars, { time: null });
    Object.assign(uncertain.hiddenStems, { time: null });
    Object.assign(uncertain, { luckCycle: null, timeCorrection: null });
    expect(parseManseryeokChart(uncertain)).not.toBeNull();
    expect(parseManseryeokChart({ ...fixture, birthDate: "1992-08-17" })).toBeNull();
    expect(parseManseryeokChart({ ...fixture, schemaVersion: 2 })).toBeNull();
  });
});
