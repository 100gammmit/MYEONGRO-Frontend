import { describe, expect, it } from "vitest";
import { sajuReadingView } from "@/test-fixtures/saju-reading";
import { characters, relationCharacterIds, symbolInfo } from "./exploration";

describe("saju exploration dictionary", () => {
  it("covers all stems and branches in Korean and Hanja, independently", () => {
    const stems = "甲乙丙丁戊己庚辛壬癸";
    const branches = "子丑寅卯辰巳午未申酉戌亥";
    for (const [lane, hanja, korean, elements] of [
      ["stem", stems, "갑을병정무기경신임계", ["wood", "wood", "fire", "fire", "earth", "earth", "metal", "metal", "water", "water"]],
      ["branch", branches, "자축인묘진사오미신유술해", ["water", "earth", "wood", "wood", "earth", "fire", "fire", "earth", "metal", "metal", "earth", "water"]],
    ] as const) {
      Array.from(hanja).forEach((symbol, index) => {
        expect(symbolInfo(symbol, lane)).toEqual({ korean: korean[index], element: elements[index] });
        expect(symbolInfo(korean[index], lane)).toEqual(symbolInfo(symbol, lane));
      });
    }
    expect(symbolInfo("미", "stem")).toBeUndefined();
    expect(symbolInfo("갑", "branch")).toBeUndefined();
    expect(symbolInfo("constructor", "stem")).toBeUndefined();
  });

  it("does not create characters for missing or malformed pillars", () => {
    const snapshot = sajuReadingView().input.calculationSnapshot;
    snapshot.pillars.year = { ganZhi: "?" };
    snapshot.pillars.month = null;
    expect(characters(snapshot).map((value) => value.id)).toEqual(["day-stem", "day-branch"]);
    snapshot.pillars.day = { ganZhi: "??" };
    expect(characters(snapshot).every((value) => value.element === undefined)).toBe(true);
  });

  it("resolves only unambiguous member positions in the correct lane", () => {
    const snapshot = sajuReadingView().input.calculationSnapshot;
    snapshot.pillars = { year: { ganZhi: "갑자" }, month: { ganZhi: "기축" }, day: { ganZhi: "경오" }, time: null };
    expect(relationCharacterIds(snapshot, { type: "stem_combination", members: ["甲", "己"] })).toEqual(["year-stem", "month-stem"]);
    expect(relationCharacterIds(snapshot, { type: "branch_clash", members: ["자", "오"] })).toEqual(["year-branch", "day-branch"]);
    snapshot.pillars.time = { ganZhi: "갑술" };
    expect(relationCharacterIds(snapshot, { type: "stem_combination", members: ["갑", "기"] })).toEqual([]);
    expect(relationCharacterIds(snapshot, { type: "unknown", members: ["갑", "기"] })).toEqual([]);
    expect(relationCharacterIds(snapshot, { type: "constructor", members: ["갑", "기"] })).toEqual([]);
    expect(relationCharacterIds(snapshot, { type: "branch_clash", members: ["축", "미"] })).toEqual([]);
  });

  it("handles self-punishment without choosing an arbitrary duplicate pair", () => {
    const snapshot = sajuReadingView().input.calculationSnapshot;
    snapshot.pillars = { year: { ganZhi: "갑진" }, month: { ganZhi: "무진" }, day: null, time: null };
    const relation = { type: "branch_punishment", members: ["진", "진"] };
    expect(relationCharacterIds(snapshot, relation)).toEqual(["year-branch", "month-branch"]);
    snapshot.pillars.day = { ganZhi: "병진" };
    expect(relationCharacterIds(snapshot, relation)).toEqual([]);
    expect(relationCharacterIds(snapshot, { type: "branch_punishment", members: ["?"] })).toEqual([]);
  });
});
