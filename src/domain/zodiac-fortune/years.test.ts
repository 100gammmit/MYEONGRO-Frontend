import { describe, expect, it } from "vitest";

import rawIpchun from "./ipchun.json";
import { FINDER_FIRST_YEAR, FINDER_LAST_YEAR, findZodiacByYear, getIpchun } from "./years";

describe("입춘 table", () => {
  it("covers every finder year with an early-February Korea time", () => {
    const years = Object.keys(rawIpchun).map(Number);
    expect(years[0]).toBe(FINDER_FIRST_YEAR);
    expect(years.at(-1)).toBe(FINDER_LAST_YEAR);
    expect(years).toHaveLength(FINDER_LAST_YEAR - FINDER_FIRST_YEAR + 1);
    for (const year of years) {
      expect(getIpchun(year)).toMatch(new RegExp(`^${year}-02-0[345]T\\d{2}:\\d{2}[+-]\\d{2}:\\d{2}$`));
    }
  });

  // Published by the Korea Astronomy and Space Science Institute (KASI) for these years.
  it.each([
    [2024, "2024-02-04T17:27+09:00"],
    [2025, "2025-02-03T23:10+09:00"],
    [2026, "2026-02-04T05:02+09:00"],
    [2027, "2027-02-04T10:46+09:00"],
  ])("matches the published time for %i", (year, expected) => {
    expect(getIpchun(year)).toBe(expected);
  });

  it("keeps historical Korea offsets such as the 1950s UTC+8:30", () => {
    expect(getIpchun(1955)).toMatch(/\+08:30$/);
  });
});

describe("findZodiacByYear", () => {
  it("splits a birth year at that year's 입춘", () => {
    expect(findZodiacByYear(1996)).toEqual({ year: 1996, ipchunMonth: 2, ipchunDay: 4, after: "rat", before: "pig" });
    expect(findZodiacByYear(2025)).toMatchObject({ ipchunDay: 3, after: "snake", before: "dragon" });
  });

  it("answers nothing outside the supported range", () => {
    expect(findZodiacByYear(1899)).toBeNull();
    expect(findZodiacByYear(2100)).toBeNull();
  });
});
