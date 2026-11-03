import { describe, expect, it } from "vitest";
import { sajuReadingView } from "@/test-fixtures/saju-reading";
import { characters, CONTROLS, ELEMENTS, GENERATES, pairedRelations, relationCharacterIds, symbolInfo } from "./exploration";

describe("saju exploration dictionary", () => {
  it("defines all traditional symbols and both complete five-element cycles", () => {
    expect(Object.fromEntries(Object.entries(ELEMENTS).map(([key, value]) => [key, [value.season, value.direction]]))).toEqual({
      wood: ["봄", "동쪽"], fire: ["여름", "남쪽"], earth: ["계절이 바뀌는 사이", "가운데"],
      metal: ["가을", "서쪽"], water: ["겨울", "북쪽"],
    });
    expect(GENERATES).toEqual({ wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood" });
    expect(CONTROLS).toEqual({ wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood" });
    for (const cycle of [GENERATES, CONTROLS]) {
      for (const start of Object.keys(ELEMENTS) as (keyof typeof ELEMENTS)[]) {
        let current = start;
        const seen = new Set<string>();
        for (let index = 0; index < 5; index++) { seen.add(current); current = cycle[current]; }
        expect(seen.size).toBe(5);
        expect(current).toBe(start);
      }
    }
  });

  it.each([["寅", "亥", "인", "해"], ["巳", "申", "사", "신"]])("pairs %s%s combination/break independent of order and script", (first, second, koreanFirst, koreanSecond) => {
    const snapshot = sajuReadingView().input.calculationSnapshot;
    const combination = { type: "branch_combination", members: [first, second] };
    const pairedBreak = { type: "branch_break", members: [koreanSecond, koreanFirst] };
    snapshot.relations = [combination, pairedBreak, { type: "branch_clash", members: ["자", "오"] }];
    const before = JSON.stringify(snapshot);
    expect(pairedRelations(snapshot, combination)).toEqual([pairedBreak]);
    expect(pairedRelations(snapshot, pairedBreak)).toEqual([combination]);
    expect(JSON.stringify(snapshot)).toBe(before);
  });

  it("compares member multiplicities, keeps lanes separate and handles other relation types generically", () => {
    const snapshot = sajuReadingView().input.calculationSnapshot;
    const selected = { type: "branch_punishment", members: ["진", "진"] };
    const other = { type: "branch_break", members: ["辰", "辰"] };
    snapshot.relations = [selected, other, { type: "branch_clash", members: ["진"] },
      { type: "branch_combination", members: ["진", "진", "진"] },
      { type: "branch_punishment", members: ["辰", "辰"] },
      { type: "constructor", members: ["진", "진"] }];
    expect(pairedRelations(snapshot, selected)).toEqual([other]);
    snapshot.relations = [{ type: "stem_combination", members: ["신", "갑"] }, { type: "branch_break", members: ["신", "갑"] }];
    expect(pairedRelations(snapshot, snapshot.relations[0])).toEqual([]);
    expect(pairedRelations(snapshot, { type: "constructor", members: ["진", "진"] })).toEqual([]);
    expect(pairedRelations(snapshot, { type: "branch_break", members: ["?", "?"] })).toEqual([]);
    expect(pairedRelations(snapshot, { type: "branch_break", members: [] })).toEqual([]);
  });
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
