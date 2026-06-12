import { describe, expect, it } from "vitest";

import {
  GREGORIAN_MVP_LIMITS,
  GregorianFourPillarsCalculator,
  LunarCalendarUnsupportedError,
  SajuInputValidationError,
  calculateFourPillars,
  createDemoInterpretation,
  parseSajuBirthInput,
  type FourPillars,
  type FourPillarsCalculator,
} from "./index";

describe("parseSajuBirthInput", () => {
  it("returns a validated solar birth input", () => {
    expect(
      parseSajuBirthInput({
        calendarType: "solar",
        birthDate: "2024-02-10",
        birthTime: "23:05",
        gender: "female",
      }),
    ).toEqual({
      calendarType: "solar",
      birthDate: "2024-02-10",
      birthTime: "23:05",
      gender: "female",
    });
  });

  it.each([
    ["nonexistent date", "2023-02-29", "12:00"],
    ["invalid date format", "2024-2-10", "12:00"],
    ["hour beyond 23", "2024-02-10", "24:00"],
    ["minute beyond 59", "2024-02-10", "12:60"],
  ])("rejects %s", (_case, birthDate, birthTime) => {
    expect(() =>
      parseSajuBirthInput({
        calendarType: "solar",
        birthDate,
        birthTime,
        gender: "unspecified",
      }),
    ).toThrow(SajuInputValidationError);
  });

  it("allows birth time to be omitted", () => {
    const input = parseSajuBirthInput({
      calendarType: "solar",
      birthDate: "2000-01-01",
      gender: "male",
    });

    expect(input.birthTime).toBeUndefined();
  });
});

describe("calculateFourPillars", () => {
  it("uses a replaceable calculator port", () => {
    const expected: FourPillars = {
      year: "甲子",
      month: "乙丑",
      day: "丙寅",
      hour: "미상",
    };
    const calculator: FourPillarsCalculator = {
      calculate: () => expected,
    };

    expect(
      calculateFourPillars(
        {
          calendarType: "solar",
          birthDate: "2024-01-01",
          gender: "unspecified",
        },
        calculator,
      ),
    ).toEqual(expected);
  });

  it("throws an explicit unsupported error for lunar input", () => {
    expect(() =>
      calculateFourPillars({
        calendarType: "lunar",
        birthDate: "2024-01-01",
        gender: "unspecified",
      }),
    ).toThrow(LunarCalendarUnsupportedError);
  });

  it("allows an injected calculator to handle validated lunar input", () => {
    const expected: FourPillars = {
      year: "甲辰",
      month: "丙寅",
      day: "甲辰",
      hour: "미상",
    };
    const calculator: FourPillarsCalculator = {
      calculate: (input) => {
        expect(input.calendarType).toBe("lunar");
        return expected;
      },
    };

    expect(
      calculateFourPillars(
        {
          calendarType: "lunar",
          birthDate: "2024-01-01",
          gender: "unspecified",
        },
        calculator,
      ),
    ).toEqual(expected);
  });
});

describe("GregorianFourPillarsCalculator", () => {
  const calculator = new GregorianFourPillarsCalculator();

  it("documents its supported range and Gregorian boundary approximation", () => {
    expect(GREGORIAN_MVP_LIMITS).toEqual({
      minimumYear: 1900,
      maximumYear: 2099,
      yearBoundary: "gregorian-january-1",
      monthBoundary: "gregorian-month-start",
      dayBoundary: "local-midnight",
      hourBoundary: "local-civil-two-hour-blocks",
    });
  });

  it.each([
    ["1984-01-01", "甲子"],
    ["2024-01-01", "甲辰"],
  ])("derives the sexagenary year for %s", (birthDate, expectedYear) => {
    expect(
      calculator.calculate(
        parseSajuBirthInput({
          calendarType: "solar",
          birthDate,
          gender: "unspecified",
        }),
      ).year,
    ).toBe(expectedYear);
  });

  it.each([
    ["1949-10-01", "甲子"],
    ["1949-10-02", "乙丑"],
  ])("derives the sexagenary day for %s", (birthDate, expectedDay) => {
    expect(
      calculator.calculate(
        parseSajuBirthInput({
          calendarType: "solar",
          birthDate,
          gender: "unspecified",
        }),
      ).day,
    ).toBe(expectedDay);
  });

  it("derives the month stem from the year stem and month branch", () => {
    expect(
      calculator.calculate(
        parseSajuBirthInput({
          calendarType: "solar",
          birthDate: "2024-02-10",
          gender: "unspecified",
        }),
      ).month,
    ).toBe("丙寅");
  });

  it("moves January one stem and branch backward from February", () => {
    expect(
      calculator.calculate(
        parseSajuBirthInput({
          calendarType: "solar",
          birthDate: "2024-01-10",
          gender: "unspecified",
        }),
      ).month,
    ).toBe("乙丑");
  });

  it.each([
    ["23:00", "甲子"],
    ["00:00", "甲子"],
    ["00:59", "甲子"],
    ["01:00", "乙丑"],
    ["02:59", "乙丑"],
    ["03:00", "丙寅"],
  ])("uses local two-hour branch boundaries at %s", (birthTime, expectedHour) => {
    expect(
      calculator.calculate(
        parseSajuBirthInput({
          calendarType: "solar",
          birthDate: "1949-10-01",
          birthTime,
          gender: "unspecified",
        }),
      ).hour,
    ).toBe(expectedHour);
  });

  it("marks an omitted birth time as unknown", () => {
    expect(
      calculator.calculate(
        parseSajuBirthInput({
          calendarType: "solar",
          birthDate: "1949-10-01",
          gender: "unspecified",
        }),
      ).hour,
    ).toBe("미상");
  });

  it.each(["1900-01-01", "2099-12-31"])(
    "accepts the documented boundary date %s",
    (birthDate) => {
      expect(() =>
        calculator.calculate(
          parseSajuBirthInput({
            calendarType: "solar",
            birthDate,
            gender: "unspecified",
          }),
        ),
      ).not.toThrow();
    },
  );

  it.each(["1899-12-31", "2100-01-01"])(
    "rejects the out-of-range boundary date %s",
    (birthDate) => {
      expect(() =>
        calculator.calculate(
          parseSajuBirthInput({
            calendarType: "solar",
            birthDate,
            gender: "unspecified",
          }),
        ),
      ).toThrow(SajuInputValidationError);
    },
  );

  it("returns two-character stem-branch output for known pillars", () => {
    const result = calculator.calculate(
      parseSajuBirthInput({
        calendarType: "solar",
        birthDate: "2024-02-10",
        birthTime: "12:30",
        gender: "female",
      }),
    );

    expect(result).toMatchObject({
      year: expect.stringMatching(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/),
      month: expect.stringMatching(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/),
      day: expect.stringMatching(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/),
      hour: expect.stringMatching(/^[甲乙丙丁戊己庚辛壬癸][子丑寅卯辰巳午未申酉戌亥]$/),
    });
  });
});

describe("createDemoInterpretation", () => {
  it("returns deterministic Korean copy derived from the pillars", () => {
    const pillars: FourPillars = {
      year: "甲辰",
      month: "丙寅",
      day: "甲辰",
      hour: "甲子",
    };

    const first = createDemoInterpretation(pillars);
    const second = createDemoInterpretation(pillars);

    expect(first).toBe(second);
    expect(first).toContain("일주 甲辰");
    expect(first).toContain("목");
    expect(first).toContain("데모 해석");
  });
});
