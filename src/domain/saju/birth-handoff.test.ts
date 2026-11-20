import { afterEach, describe, expect, it } from "vitest";

import { EMPTY_BIRTH_VALUES, type SajuBirthValues } from "./birth-input";
import { BIRTH_HANDOFF_KEY, BIRTH_HANDOFF_TTL_MS, peekBirthHandoff, saveBirthHandoff, takeBirthHandoff } from "./birth-handoff";

const values: SajuBirthValues = {
  ...EMPTY_BIRTH_VALUES,
  birthDate: "1992-08-17",
  birthTimePrecision: "approximate",
  birthHour: "14",
  provinceCode: "11",
  cityCode: "11110",
  luckDirectionBasis: "male",
  dayBoundary: "HOUR_23",
};

afterEach(() => {
  window.sessionStorage.clear();
  window.localStorage.clear();
});

describe("birth hand-off", () => {
  it("keeps the input in this tab only and hands it over once", () => {
    expect(saveBirthHandoff(values, 1_000)).toBe(true);
    expect(window.localStorage.length).toBe(0);
    expect(takeBirthHandoff(2_000)).toEqual(values);
    expect(window.sessionStorage.getItem(BIRTH_HANDOFF_KEY)).toBeNull();
    expect(takeBirthHandoff(3_000)).toBeNull();
  });

  it("peeking keeps a valid value for a later mount but drops an expired one", () => {
    saveBirthHandoff(values, 0);
    expect(peekBirthHandoff(1_000)).toEqual(values);
    expect(peekBirthHandoff(2_000)).toEqual(values);
    expect(peekBirthHandoff(BIRTH_HANDOFF_TTL_MS + 1)).toBeNull();
    expect(window.sessionStorage.getItem(BIRTH_HANDOFF_KEY)).toBeNull();
  });

  it("still holds after a 29-minute sign-up and is dropped after 30 minutes", () => {
    saveBirthHandoff(values, 0);
    expect(takeBirthHandoff(29 * 60 * 1000)).toEqual(values);
    saveBirthHandoff(values, 0);
    expect(takeBirthHandoff(BIRTH_HANDOFF_TTL_MS + 1)).toBeNull();
    expect(window.sessionStorage.getItem(BIRTH_HANDOFF_KEY)).toBeNull();
  });

  it("drops a broken or tampered value without throwing", () => {
    window.sessionStorage.setItem(BIRTH_HANDOFF_KEY, "{not json");
    expect(takeBirthHandoff()).toBeNull();
    window.sessionStorage.setItem(BIRTH_HANDOFF_KEY, JSON.stringify({ savedAt: Date.now(), values: { ...values, cityCode: "<script>" } }));
    expect(takeBirthHandoff()).toBeNull();
    expect(window.sessionStorage.getItem(BIRTH_HANDOFF_KEY)).toBeNull();
  });
});
