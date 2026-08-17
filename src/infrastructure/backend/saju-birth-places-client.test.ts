import { afterEach, describe, expect, it, vi } from "vitest";

import {
  fetchSajuBirthPlaces,
  SajuBirthPlacesClientError,
} from "./saju-birth-places-client";

afterEach(() => vi.restoreAllMocks());

describe("fetchSajuBirthPlaces", () => {
  it("uses the authenticated same-origin proxy and parses the response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      version: "kr-admin-v1-province",
      provinces: [{
        provinceCode: "36",
        provinceName: "세종특별자치시",
      }],
    }));

    const catalog = await fetchSajuBirthPlaces();

    expect(fetchMock).toHaveBeenCalledWith("/api/saju/birth-places", {
      credentials: "same-origin",
      cache: "no-store",
    });
    expect(catalog.provinces[0]?.provinceCode).toBe("36");
  });

  it("preserves the backend code, field, and message", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      code: "INVALID_BIRTH_PLACE",
      field: "birthProfile.cityCode",
      message: "출생 도시를 다시 선택해 주세요.",
    }, { status: 400 }));

    await expect(fetchSajuBirthPlaces()).rejects.toEqual(expect.objectContaining({
      status: 400,
      apiError: {
        code: "INVALID_BIRTH_PLACE",
        field: "birthProfile.cityCode",
        message: "출생 도시를 다시 선택해 주세요.",
      },
    } satisfies Partial<SajuBirthPlacesClientError>));
  });
});
