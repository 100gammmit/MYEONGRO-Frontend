import { describe, expect, it, vi } from "vitest";

import fixture from "@/test-fixtures/manseryeok-chart.json";

import { calculateManseryeok, fetchPublicBirthPlaces } from "./manseryeok-client";

const ENDPOINT = "https://api.example.test/api/saju/calculations";
const profile = { calendarType: "solar", birthDate: "1992-08-17", birthTimePrecision: "unknown", luckDirectionBasis: "male" } as const;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

describe("calculateManseryeok", () => {
  it("calls the API without cookies and sends next year only when asked", async () => {
    const fetcher = vi.fn().mockResolvedValue(json(fixture));
    expect((await calculateManseryeok(ENDPOINT, { birthProfile: profile }, { fetcher })).kind).toBe("ok");
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init).toMatchObject({ method: "POST", credentials: "omit", cache: "no-store" });
    expect(JSON.parse(init.body)).toEqual({ birthProfile: profile });

    await calculateManseryeok(ENDPOINT, { birthProfile: profile, options: { dayBoundary: "HOUR_23" }, referenceYear: 2027 }, { fetcher });
    expect(JSON.parse(fetcher.mock.calls[1][1].body)).toEqual({ birthProfile: profile, options: { dayBoundary: "HOUR_23" }, referenceYear: 2027 });
  });

  it("retries a busy server twice with spread-out waits, then reports busy", async () => {
    const fetcher = vi.fn().mockImplementation(() => Promise.resolve(json({ code: "SAJU_CALCULATION_BUSY" }, 503)));
    const wait = vi.fn().mockResolvedValue(undefined);
    const onRetry = vi.fn();
    const outcome = await calculateManseryeok(ENDPOINT, { birthProfile: profile }, { fetcher, wait, onRetry, random: () => 0.5 });
    expect(outcome.kind).toBe("busy");
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(onRetry.mock.calls).toEqual([[1], [2]]);
    expect(wait.mock.calls).toEqual([[1200], [1200]]);
  });

  it("returns the result once a retry succeeds", async () => {
    const fetcher = vi.fn()
      .mockResolvedValueOnce(json({ code: "SAJU_CALCULATION_DEADLINE" }, 503))
      .mockResolvedValueOnce(json(fixture));
    const outcome = await calculateManseryeok(ENDPOINT, { birthProfile: profile }, { fetcher, wait: async () => {} });
    expect(outcome.kind).toBe("ok");
  });

  it("maps rate limits, a switched-off feature, field errors and broken replies", async () => {
    const call = (response: Response) => calculateManseryeok(ENDPOINT, { birthProfile: profile }, { fetcher: vi.fn().mockResolvedValue(response) });
    expect(await call(json({ code: "SAJU_CALCULATION_RATE_LIMITED" }, 429))).toEqual({ kind: "rateLimited" });
    expect(await call(new Response(null, { status: 404 }))).toEqual({ kind: "unavailable" });
    expect(await call(json({ code: "INVALID_BIRTH_DATE", field: "birthProfile.birthDate", error: "날짜를 확인해 주세요." }, 400)))
      .toEqual({ kind: "invalid", code: "INVALID_BIRTH_DATE", field: "birthProfile.birthDate", message: "날짜를 확인해 주세요." });
    expect(await call(json({ ...fixture, schemaVersion: 9 }))).toEqual({ kind: "failed" });
    expect(await call(json({ code: "SAJU_CALCULATION_FAILED" }, 500))).toEqual({ kind: "failed" });
    expect((await calculateManseryeok(ENDPOINT, { birthProfile: profile }, { fetcher: vi.fn().mockRejectedValue(new TypeError("offline")) })).kind).toBe("failed");
  });
});

describe("fetchPublicBirthPlaces", () => {
  it("reads the list and tells a switched-off feature apart from a failure", async () => {
    const places = { version: "kr-admin-v1", provinces: [{ provinceCode: "11", provinceName: "서울특별시", cities: [] }] };
    expect((await fetchPublicBirthPlaces(ENDPOINT, vi.fn().mockResolvedValue(json(places)))).kind).toBe("ok");
    expect(await fetchPublicBirthPlaces(ENDPOINT, vi.fn().mockResolvedValue(new Response(null, { status: 404 })))).toEqual({ kind: "unavailable" });
    expect(await fetchPublicBirthPlaces(ENDPOINT, vi.fn().mockResolvedValue(json({}, 500)))).toEqual({ kind: "failed" });
  });
});
