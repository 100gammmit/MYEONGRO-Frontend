import { afterEach, describe, expect, it, vi } from "vitest";

import {
  analyticsLocation,
  analyticsPath,
  analyticsReferrer,
  gaMeasurementId,
  isPrivateAnalyticsPath,
} from "./analytics";

const ORIGIN = "https://www.myeongro.com";
const READING_ID = "6f1c2a9e-3b4d-4e5f-8a7b-9c0d1e2f3a4b";

describe("gaMeasurementId", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("accepts a GA4 measurement ID", () => {
    expect(gaMeasurementId(" G-AB12CD34EF ")).toBe("G-AB12CD34EF");
  });

  it("reads the environment when no value is passed", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "G-AB12CD34EF");
    expect(gaMeasurementId()).toBe("G-AB12CD34EF");
  });

  it("returns null when the environment has no ID", () => {
    vi.stubEnv("NEXT_PUBLIC_GA_MEASUREMENT_ID", "");
    expect(gaMeasurementId()).toBeNull();
  });

  it("rejects empty and non-GA4 values", () => {
    expect(gaMeasurementId("")).toBeNull();
    expect(gaMeasurementId("UA-12345-1")).toBeNull();
    expect(gaMeasurementId("G-ab12\"><script>")).toBeNull();
  });
});

describe("analyticsPath", () => {
  it("replaces reading and record IDs", () => {
    expect(analyticsPath(`/tarot/results/${READING_ID}`)).toBe("/tarot/results/:id");
    expect(analyticsPath(`/saju/results/${READING_ID}`)).toBe("/saju/results/:id");
    expect(analyticsPath(`/records/${READING_ID}`)).toBe("/records/:id");
    expect(isPrivateAnalyticsPath(`/records/${READING_ID}`)).toBe(true);
  });

  it("keeps public paths, including the record list and shared cards", () => {
    expect(analyticsPath("/records")).toBe("/records");
    expect(analyticsPath("/zodiac/horse")).toBe("/zodiac/horse");
    expect(analyticsPath("/tarot/daily/AbCdEf1234")).toBe("/tarot/daily/AbCdEf1234");
    expect(isPrivateAnalyticsPath("/records")).toBe(false);
  });
});

describe("analyticsLocation", () => {
  it("keeps only campaign tags from the query", () => {
    expect(analyticsLocation(
      ORIGIN,
      "/zodiac/horse",
      "?utm_source=instagram&utm_medium=social&utm_campaign=2027_zodiac&fbclid=abc&next=%2Frecords",
    )).toBe(`${ORIGIN}/zodiac/horse?utm_source=instagram&utm_medium=social&utm_campaign=2027_zodiac`);
  });

  it("drops every other query and the reading ID", () => {
    expect(analyticsLocation(ORIGIN, `/tarot/results/${READING_ID}`, "?question=hello"))
      .toBe(`${ORIGIN}/tarot/results/:id`);
    expect(analyticsLocation(ORIGIN, "/login", "?next=%2Ftarot%3Fspread%3Dthree")).toBe(`${ORIGIN}/login`);
  });
});

describe("analyticsReferrer", () => {
  it("cuts other sites to their origin", () => {
    expect(analyticsReferrer("https://l.instagram.com/?u=https%3A%2F%2Fwww.myeongro.com&e=xyz", ORIGIN))
      .toBe("https://l.instagram.com");
  });

  it("cleans our own pages", () => {
    expect(analyticsReferrer(`${ORIGIN}/saju/results/${READING_ID}?x=1`, ORIGIN)).toBe(`${ORIGIN}/saju/results/:id`);
  });

  it("returns nothing for an empty or broken referrer", () => {
    expect(analyticsReferrer("", ORIGIN)).toBe("");
    expect(analyticsReferrer("not a url", ORIGIN)).toBe("");
  });
});
