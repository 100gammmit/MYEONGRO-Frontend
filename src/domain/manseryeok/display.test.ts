import { describe, expect, it } from "vitest";

import fixture from "@/test-fixtures/manseryeok-chart.json";

import {
  branchTenGod,
  correctedTime,
  currentLuckIndex,
  elementCellCount,
  ganZhiGlyphs,
  glyph,
  relationGroups,
} from "./display";
import { parseManseryeokChart, type ManseryeokChart } from "./schema";

const chart = parseManseryeokChart(fixture) as ManseryeokChart;

describe("manseryeok display helpers", () => {
  it("keeps 辛 and 申 apart by lane and marks yin and yang", () => {
    expect(glyph("辛", "stem")).toEqual({ hanja: "辛", korean: "신", element: "metal", sign: "−" });
    expect(glyph("申", "branch")).toEqual({ hanja: "申", korean: "신", element: "metal", sign: "+" });
    expect(ganZhiGlyphs("신해")?.map((value) => value.hanja)).toEqual(["辛", "亥"]);
  });

  it("reads the branch ten god from its main hidden stem", () => {
    expect(branchTenGod(chart, "day")).toBe("정인");
    expect(branchTenGod(chart, "time")).toBe("정재");
  });

  it("groups present relations and lists the absent ones", () => {
    const groups = relationGroups(chart);
    expect(groups.present.map((group) => [group.label, group.items.length])).toEqual([["해", 1], ["반합", 2], ["원진", 1]]);
    expect(groups.absent).toContain("천간합");
    expect(groups.absent).not.toContain("반합");
  });

  it("grows the element cells past four only when one element needs more", () => {
    expect(elementCellCount(chart)).toBe(4);
    expect(elementCellCount({ ...chart, fiveElements: { ...chart.fiveElements, metal: 6 } })).toBe(6);
  });

  it("shows one corrected time when exact, a range when approximate and none when unknown", () => {
    expect(correctedTime(chart)).toEqual({ kind: "exact", input: "14:30", corrected: "13:54" });
    const approximate = { ...chart, uncertainty: { ...chart.uncertainty, precision: "approximate" as const }, timeCorrection: { ...chart.timeCorrection!, civilTime: "1992-08-17T14:00", trueSolarTime: "1992-08-17T13:24" } };
    expect(correctedTime(approximate)).toEqual({ kind: "approximate", input: "14:00", from: "12:24", to: "14:24" });
    expect(correctedTime({ ...chart, timeCorrection: null })).toEqual({ kind: "none" });
  });

  it("finds the luck period that contains a year", () => {
    expect(currentLuckIndex(chart, 2026)).toBe(2);
    expect(currentLuckIndex({ ...chart, luckCycle: null }, 2026)).toBe(-1);
  });
});
