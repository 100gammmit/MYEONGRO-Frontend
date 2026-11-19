import { describe, expect, it } from "vitest";

import {
  parseSajuBirthPlaces,
  parseSajuReadingCreateRequest,
  parseSajuReadingCreatedResponse,
} from "./schema";

describe("saju v3 schemas", () => {
  it("parses the province-only birth-place catalog without internal coordinates", () => {
    expect(parseSajuBirthPlaces({
      version: "kr-admin-v1-province",
      provinces: [{
        provinceCode: "11",
        provinceName: "서울특별시",
      }],
    }).provinces[0]?.provinceName).toBe("서울특별시");

    expect(() => parseSajuBirthPlaces({
      version: "kr-admin-v1-province",
      provinces: [{
        provinceCode: "11",
        provinceName: "서울특별시",
        longitude: 127,
      }],
    })).toThrow();
  });

  it("accepts the optional city list and keeps it free of coordinates", () => {
    const parsed = parseSajuBirthPlaces({
      version: "kr-admin-v1",
      provinces: [{
        provinceCode: "11",
        provinceName: "서울특별시",
        cities: [{ cityCode: "11110", cityName: "종로구" }],
      }],
    });
    expect(parsed.provinces[0]?.cities).toEqual([{ cityCode: "11110", cityName: "종로구" }]);

    for (const city of [{ cityCode: "111", cityName: "종로구" }, { cityCode: "11110", cityName: "종로구", longitude: 126.98 }]) {
      expect(() => parseSajuBirthPlaces({
        version: "kr-admin-v1",
        provinces: [{ provinceCode: "11", provinceName: "서울특별시", cities: [city] }],
      })).toThrow();
    }
  });

  it("requires time for exact/approximate and omits it for unknown", () => {
    const base = {
      requestId: "11111111-1111-4111-8111-111111111111",
      question: "올해 이직을 준비해도 괜찮을까요?",
      focusArea: "career",
      birthProfile: {
        calendarType: "solar",
        birthDate: "1992-08-17",
        provinceCode: "11",
        luckDirectionBasis: "unspecified",
      },
    };

    expect(parseSajuReadingCreateRequest({
      ...base,
      birthProfile: {
        ...base.birthProfile,
        birthTimePrecision: "approximate",
        birthTime: "14:30",
      },
    }).birthProfile.birthTime).toBe("14:30");

    expect(() => parseSajuReadingCreateRequest({
      ...base,
      birthProfile: {
        ...base.birthProfile,
        provinceCode: undefined,
        birthTimePrecision: "unknown",
        birthTime: "14:30",
      },
    })).toThrow();

    expect(() => parseSajuReadingCreateRequest({
      ...base,
      kind: "saju",
      birthProfile: {
        ...base.birthProfile,
        provinceCode: undefined,
        birthTimePrecision: "unknown",
      },
    })).toThrow();
  });

  it("accepts only a saju schema v5 creation response", () => {
    expect(parseSajuReadingCreatedResponse({
      reading: {
        id: "reading-id",
        kind: "saju",
        schemaVersion: 5,
        status: "completed",
        input: {},
        result: {},
      },
    }).reading.id).toBe("reading-id");

    expect(() => parseSajuReadingCreatedResponse({
      reading: {
        id: "reading-id",
        kind: "saju",
        schemaVersion: 1,
        status: "completed",
      },
    })).toThrow();
  });
});
