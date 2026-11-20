import { describe, expect, it } from "vitest";

import {
  EMPTY_BIRTH_VALUES,
  birthProfileOf,
  birthTimeOf,
  calculationBasisText,
  calculationOptionsOf,
  findMissingBirthFields,
  withProvince,
  type SajuBirthValues,
} from "./birth-input";
import { parseSajuReadingCreateRequest } from "./schema";

const exact: SajuBirthValues = {
  ...EMPTY_BIRTH_VALUES,
  birthDate: "1992-08-17",
  birthTimePrecision: "exact",
  birthHour: "14",
  birthMinute: "30",
  provinceCode: "11",
  cityCode: "11110",
  luckDirectionBasis: "male",
};

describe("shared saju birth input", () => {
  it("sends an approximate time on the hour and an exact time to the minute", () => {
    expect(birthTimeOf(exact)).toBe("14:30");
    expect(birthTimeOf({ ...exact, birthTimePrecision: "approximate" })).toBe("14:00");
    expect(birthTimeOf({ ...exact, birthTimePrecision: "unknown" })).toBeUndefined();
  });

  it("leaves time, province and city out of the profile when the time is unknown", () => {
    expect(birthProfileOf(exact)).toEqual({
      calendarType: "solar", birthDate: "1992-08-17", birthTimePrecision: "exact",
      birthTime: "14:30", provinceCode: "11", cityCode: "11110", luckDirectionBasis: "male",
    });
    expect(birthProfileOf({ ...exact, birthTimePrecision: "unknown" })).toEqual({
      calendarType: "solar", birthDate: "1992-08-17", birthTimePrecision: "unknown", luckDirectionBasis: "male",
    });
    expect(birthProfileOf({ ...exact, cityCode: "" })).not.toHaveProperty("cityCode");
  });

  it("sends only calculation options that differ from the defaults", () => {
    expect(calculationOptionsOf(exact)).toBeUndefined();
    expect(calculationOptionsOf({ ...exact, dayBoundary: "HOUR_23" })).toEqual({ dayBoundary: "HOUR_23" });
    expect(calculationOptionsOf({ ...exact, equationOfTime: false })).toEqual({ equationOfTime: false });
  });

  it("asks for the minute only when the time is exact", () => {
    const base = { ...EMPTY_BIRTH_VALUES, birthDate: "1992-08-17", provinceCode: "11" };
    expect(findMissingBirthFields({ ...base, birthTimePrecision: "exact", birthHour: "14" })).toEqual({ birthMinute: "태어난 분을 골라 주세요." });
    expect(findMissingBirthFields({ ...base, birthTimePrecision: "approximate", birthHour: "14" })).toEqual({});
    expect(findMissingBirthFields({ ...EMPTY_BIRTH_VALUES, birthDate: "1992-08-17", birthTimePrecision: "unknown" })).toEqual({});
  });

  it("drops a city that does not belong to a newly chosen province", () => {
    expect(withProvince(exact, "36").cityCode).toBe("");
    expect(withProvince(exact, "11").cityCode).toBe("11110");
  });

  it("names the saved calculation basis, or nothing for older records", () => {
    expect(calculationBasisText(undefined)).toBeNull();
    expect(calculationBasisText({ dayBoundary: "MIDNIGHT", equationOfTime: true, coordinateSource: "province" })).toBe("명로 기본 계산 기준");
    expect(calculationBasisText({ dayBoundary: "MIDNIGHT", equationOfTime: true, coordinateSource: "reference" })).toBe("명로 기본 계산 기준");
    expect(calculationBasisText({ dayBoundary: "HOUR_23", equationOfTime: false, coordinateSource: "city" }))
      .toBe("하루 경계 23시 · 균시차 제외 · 시·군·구 경도 기준");
  });

  it("accepts a city and options in the reading request only where the backend does", () => {
    const request = {
      requestId: "8f6e2a3b-1c4d-4e5f-9a0b-1c2d3e4f5a6b",
      question: "질문",
      focusArea: "career",
      birthProfile: birthProfileOf(exact),
      calculationOptions: { dayBoundary: "HOUR_23" },
    };
    expect(parseSajuReadingCreateRequest(request).calculationOptions).toEqual({ dayBoundary: "HOUR_23" });
    expect(() => parseSajuReadingCreateRequest({ ...request, birthProfile: { ...birthProfileOf(exact), cityCode: "36110" } })).toThrow();
    expect(() => parseSajuReadingCreateRequest({ ...request, calculationOptions: { dayBoundary: "NOON" } })).toThrow();
    expect(() => parseSajuReadingCreateRequest({ ...request, calculationOptions: { equationOfTime: null } })).toThrow();
  });
});
