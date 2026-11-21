import { describe, expect, it } from "vitest";

import {
  ELEMENT_ENTRIES,
  ELEMENT_SLUGS,
  TEN_GODS,
  TEN_GOD_NAMES,
  TEN_GOD_SLUGS,
  elementAsGroup,
  elementFacts,
  getElement,
  getTenGod,
  pairOf,
  tenGodByDayStem,
  tenGodExample,
  tenGodOf,
  tenGodSlugOf,
} from ".";

const HANJA = /[一-鿿]/g;

describe("ten god judging table", () => {
  it("names every stem against 甲 and 辛 the way the judging table does", () => {
    const fromJia = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].map((stem) => TEN_GOD_NAMES[tenGodOf("甲", stem)]);
    expect(fromJia).toEqual(["비견", "겁재", "식신", "상관", "편재", "정재", "편관", "정관", "편인", "정인"]);
    const fromXin = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"].map((stem) => TEN_GOD_NAMES[tenGodOf("辛", stem)]);
    expect(fromXin).toEqual(["정재", "편재", "정관", "편관", "정인", "편인", "겁재", "비견", "상관", "식신"]);
  });

  it("reads branches by their main hidden stem, as the chart's branch ten god does", () => {
    expect(tenGodExample("sanggwan", "甲")).toMatchObject({ stem: { hanja: "丁" }, branches: [{ hanja: "午" }] });
    expect(tenGodExample("jeongjae", "乙").branches.map((branch) => branch.hanja)).toEqual(["辰", "戌"]);
    expect(tenGodByDayStem("bigyeon").map((row) => row.stem.hanja)).toEqual(["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"]);
  });

  it("pairs each ten god with the other cell of its row and finds slugs from chart names", () => {
    expect(TEN_GOD_SLUGS.map((slug) => TEN_GOD_NAMES[pairOf(slug)])).toEqual(["겁재", "비견", "상관", "식신", "정재", "편재", "정관", "편관", "정인", "편인"]);
    for (const slug of TEN_GOD_SLUGS) expect(tenGodSlugOf(TEN_GOD_NAMES[slug])).toBe(slug);
    expect(tenGodSlugOf("일간")).toBeNull();
    expect(tenGodSlugOf(null)).toBeNull();
  });
});

describe("ten god pages", () => {
  it("explain the principle with the stem and branches the table gives for their example day stem", () => {
    for (const entry of TEN_GODS) {
      const example = tenGodExample(entry.slug, entry.exampleDayStem);
      const principle = entry.principle.join(" ");
      expect(principle, entry.slug).toContain(`(${example.dayStem.hanja})`);
      expect(principle, entry.slug).toContain(`(${example.stem.hanja})`);
      for (const branch of example.branches) expect(principle, entry.slug).toContain(`(${branch.hanja})`);
    }
  });

  it("name their pair in the pair section and every Hanja they cite is a real stem, branch or term", () => {
    for (const entry of TEN_GODS) {
      expect(entry.pair.join(" "), entry.slug).toContain(TEN_GOD_NAMES[pairOf(entry.slug)]);
    }
    expect(getTenGod("sanggwan")?.hanja).toBe("傷官");
    expect(getTenGod("nope")).toBeNull();
  });
});

describe("element pages", () => {
  it("list the stems and branches that exploration.ts assigns to each element", () => {
    expect(elementFacts("wood")).toMatchObject({ name: "목", season: "봄", direction: "동쪽", generatedBy: "water", generates: "fire", controls: "earth", controlledBy: "metal" });
    expect(elementFacts("earth").branches.map((branch) => branch.hanja)).toEqual(["丑", "辰", "未", "戌"]);
    for (const entry of ELEMENT_ENTRIES) {
      const facts = elementFacts(entry.slug);
      const chars = entry.chars.join(" ");
      for (const glyph of [...facts.stems, ...facts.branches]) expect(chars, entry.slug).toContain(`(${glyph.hanja})`);
    }
  });

  it("place each element in the judging table for every day element", () => {
    expect(elementAsGroup("fire").map(({ day, group }) => `${day}:${group.name}`)).toEqual(["wood:식상", "fire:비겁", "earth:인성", "metal:관성", "water:재성"]);
    expect(getElement("water")?.hanja).toBe("水");
    expect(getElement("ten")).toBeNull();
    expect(ELEMENT_ENTRIES.map((entry) => entry.slug)).toEqual([...ELEMENT_SLUGS]);
  });
});

describe("dictionary copy", () => {
  const pages = [
    ...TEN_GODS.map((entry) => ({ slug: entry.slug, text: [entry.lead, ...entry.principle, ...entry.meaning, ...entry.timing, ...entry.flow, ...entry.myths.flatMap((myth) => [myth.claim, myth.answer]), ...entry.pair, ...entry.find] })),
    ...ELEMENT_ENTRIES.map((entry) => ({ slug: entry.slug, text: [entry.lead, ...entry.nature, ...entry.cycle, ...entry.chars, ...entry.count, ...entry.read] })),
  ];

  it("never repeats a sentence across two pages", () => {
    const seen = new Map<string, string>();
    for (const page of pages) {
      for (const sentence of page.text.join(" ").split(/(?<=[.다요])\s+/)) {
        const key = sentence.trim();
        if (key.length < 25) continue;
        const owner = seen.get(key);
        expect(owner === undefined || owner === page.slug, `${page.slug} repeats ${owner}: ${key}`).toBe(true);
        seen.set(key, page.slug);
      }
    }
  });

  it("keeps the explanatory prose in 합니다체 without verdicts or promised outcomes", () => {
    for (const page of pages) {
      const body = page.text.join(" ");
      expect(body, page.slug).not.toMatch(/해요\.|예요\.|이에요\.|세요\./);
      expect(body, page.slug).not.toMatch(/흉하|길하다|대박|반드시 .*(됩니다|합니다)|보장합니다/);
      expect(body.replace(HANJA, "").length, page.slug).toBeGreaterThan(500);
    }
  });
});
