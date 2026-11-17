import { zodiacSlugOfYear, type ZodiacSlug } from "./slugs";
import rawIpchun from "./ipchun.json";

export const FINDER_FIRST_YEAR = 1900;
export const FINDER_LAST_YEAR = 2099;
// Sign pages list recent birth years from here up to the year before the content year.
const PAGE_FIRST_YEAR = 1948;

const STEMS = ["갑", "을", "병", "정", "무", "기", "경", "신", "임", "계"];
const BRANCHES = ["자", "축", "인", "묘", "진", "사", "오", "미", "신", "유", "술", "해"];

/** The Korean sexagenary name of a year, e.g. 1996 → "병자". */
export function ganjiName(year: number): string {
  const offset = year - 4;
  return STEMS[((offset % 10) + 10) % 10] + BRANCHES[((offset % 12) + 12) % 12];
}

/** Birth years shown on a sign page, oldest first. */
export function pageBirthYears(slug: ZodiacSlug, contentYear: number): number[] {
  const years: number[] = [];
  for (let year = PAGE_FIRST_YEAR; year < contentYear; year += 1) {
    if (zodiacSlugOfYear(year) === slug) years.push(year);
  }
  return years;
}

const IPCHUN = new Map<number, string>(
  Object.entries(rawIpchun as Record<string, string>).map(([year, at]) => [Number(year), at]),
);

/** 입춘 as Korea civil date and time ("1996-02-04T22:07+09:00"), or null outside 1900–2099. */
export function getIpchun(year: number): string | null {
  return IPCHUN.get(year) ?? null;
}

export interface YearZodiacAnswer {
  readonly year: number;
  readonly ipchunMonth: number;
  readonly ipchunDay: number;
  /** Born on or after 입춘. */
  readonly after: ZodiacSlug;
  /** Born from 1 January to the day before 입춘. */
  readonly before: ZodiacSlug;
}

/** The two possible signs of a birth year, split at that year's 입춘. Only the year is used. */
export function findZodiacByYear(year: number): YearZodiacAnswer | null {
  const at = getIpchun(year);
  if (!at) return null;
  const [, month, day] = at.slice(0, 10).split("-").map(Number);
  return { year, ipchunMonth: month, ipchunDay: day, after: zodiacSlugOfYear(year), before: zodiacSlugOfYear(year - 1) };
}
