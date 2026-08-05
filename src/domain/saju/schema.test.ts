import { describe, expect, it } from "vitest";

import {
  parseSajuBirthPlaces,
  parseSajuReadingCreateRequest,
  parseSajuReadingCreatedResponse,
} from "./schema";

describe("saju v2 schemas", () => {
  it("parses the two-depth birth-place catalog without internal coordinates", () => {
    expect(parseSajuBirthPlaces({
      version: "kr-admin-v1",
      provinces: [{
        provinceCode: "11",
        provinceName: "서울특별시",
        cities: [{ cityCode: "11110", cityName: "종로구" }],
      }],
    }).provinces[0]?.cities[0]?.cityName).toBe("종로구");

    expect(() => parseSajuBirthPlaces({
      version: "kr-admin-v1",
      provinces: [{
        provinceCode: "11",
        provinceName: "서울특별시",
        cities: [{
          cityCode: "11110",
          cityName: "종로구",
          latitude: 37.5,
        }],
      }],
    })).toThrow();
  });

  it("requires time for exact/approximate and omits it for unknown", () => {
    const base = {
      kind: "saju",
      requestId: "11111111-1111-4111-8111-111111111111",
      question: "올해 이직을 준비해도 괜찮을까요?",
      focusArea: "career",
      birthProfile: {
        calendarType: "solar",
        birthDate: "1992-08-17",
        provinceCode: "11",
        cityCode: "11110",
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
        birthTimePrecision: "unknown",
        birthTime: "14:30",
      },
    })).toThrow();
  });

  it("accepts only a saju schema v2 creation response", () => {
    expect(parseSajuReadingCreatedResponse({
      reading: {
        id: "reading-id",
        kind: "saju",
        schemaVersion: 2,
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
