import {
  LunarCalendarUnsupportedError,
  SajuInputValidationError,
} from "./errors";
import {
  parseSajuBirthInput,
  type FourPillars,
  type SajuBirthInput,
} from "./types";

const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;
const MILLISECONDS_PER_DAY = 86_400_000;
const JIA_ZI_DAY_ANCHOR = Date.UTC(1949, 9, 1);

/**
 * This calculator is intentionally a Gregorian-only MVP, not a complete
 * traditional almanac. It does not calculate solar-term instants, true solar
 * time, longitude corrections, daylight-saving history, or lunar conversion.
 */
export const GREGORIAN_MVP_LIMITS = {
  minimumYear: 1900,
  maximumYear: 2099,
  yearBoundary: "gregorian-january-1",
  monthBoundary: "gregorian-month-start",
  dayBoundary: "local-midnight",
  hourBoundary: "local-civil-two-hour-blocks",
} as const;

export interface FourPillarsCalculator {
  calculate(input: SajuBirthInput): FourPillars;
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor;
}

function stemBranch(cycleIndex: number): string {
  return `${STEMS[modulo(cycleIndex, 10)]}${BRANCHES[modulo(cycleIndex, 12)]}`;
}

function parseDateParts(birthDate: string): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = birthDate.split("-").map(Number);
  return { year, month, day };
}

function calculateYearIndex(year: number): number {
  return modulo(year - 1984, 60);
}

function calculateMonthPillar(yearStemIndex: number, month: number): string {
  // Five Tigers rule: 甲/己 years begin 丙寅, then stems advance monthly.
  // January is the preceding 丑 month, so retain -1 for the 10-stem cycle.
  const monthOffsetFromYin = month - 2;
  const yinMonthStem = modulo((yearStemIndex % 5) * 2 + 2, 10);
  const stemIndex = modulo(yinMonthStem + monthOffsetFromYin, 10);
  const branchIndex = modulo(2 + monthOffsetFromYin, 12);
  return `${STEMS[stemIndex]}${BRANCHES[branchIndex]}`;
}

function calculateDayIndex(year: number, month: number, day: number): number {
  const target = Date.UTC(year, month - 1, day);
  const elapsedDays = Math.round(
    (target - JIA_ZI_DAY_ANCHOR) / MILLISECONDS_PER_DAY,
  );
  return modulo(elapsedDays, 60);
}

function calculateHourPillar(dayStemIndex: number, birthTime?: string): string {
  if (!birthTime) {
    return "미상";
  }

  const hour = Number(birthTime.slice(0, 2));
  // 子 is 23:00-00:59; subsequent branches are two-hour civil-time blocks.
  const branchIndex = hour === 23 ? 0 : Math.floor((hour + 1) / 2);
  // Five Rats rule: 甲/己 days begin 甲子, then stems advance by branch.
  const ziHourStem = (dayStemIndex % 5) * 2;
  const stemIndex = modulo(ziHourStem + branchIndex, 10);
  return `${STEMS[stemIndex]}${BRANCHES[branchIndex]}`;
}

export class GregorianFourPillarsCalculator
  implements FourPillarsCalculator
{
  calculate(input: SajuBirthInput): FourPillars {
    if (input.calendarType === "lunar") {
      throw new LunarCalendarUnsupportedError();
    }

    const { year, month, day } = parseDateParts(input.birthDate);
    if (
      year < GREGORIAN_MVP_LIMITS.minimumYear ||
      year > GREGORIAN_MVP_LIMITS.maximumYear
    ) {
      throw new SajuInputValidationError(
        `Gregorian MVP supports years ${GREGORIAN_MVP_LIMITS.minimumYear}-${GREGORIAN_MVP_LIMITS.maximumYear}.`,
      );
    }

    const yearIndex = calculateYearIndex(year);
    const dayIndex = calculateDayIndex(year, month, day);

    return {
      year: stemBranch(yearIndex),
      month: calculateMonthPillar(yearIndex % 10, month),
      day: stemBranch(dayIndex),
      hour: calculateHourPillar(dayIndex % 10, input.birthTime),
    };
  }
}

const defaultCalculator = new GregorianFourPillarsCalculator();

export function calculateFourPillars(
  input: unknown,
  calculator: FourPillarsCalculator = defaultCalculator,
): FourPillars {
  const validatedInput = parseSajuBirthInput(input);
  return calculator.calculate(validatedInput);
}
