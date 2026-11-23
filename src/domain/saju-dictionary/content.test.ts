import { describe, expect, it } from "vitest";

import {
  BASICS,
  BRANCH_SLUGS,
  ELEMENT_ENTRIES,
  ELEMENT_SLUGS,
  HIDDEN_STEMS,
  STEM_CLASHES,
  STEM_COMBINATIONS,
  STEM_ENTRIES,
  STEM_SLUGS,
  TEN_GODS,
  TEN_GOD_NAMES,
  TEN_GOD_SLUGS,
  elementAsGroup,
  elementFacts,
  getElement,
  getStem,
  getTenGod,
  branchFacts,
  branchSlugOf,
  pairOf,
  stemFacts,
  stemSlugOf,
  tenGodByDayStem,
  tenGodExample,
  tenGodOf,
  tenGodSlugOf,
} from ".";
import { MAIN_HIDDEN_STEM } from "./rules";

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

describe("stem and branch facts", () => {
  it("uses the backend's stem combination and clash pairs, with no clash for 무 and 기", () => {
    // Backend LunarJavaFourPillarsAdapter.STEM_RELATIONS.
    expect([...STEM_COMBINATIONS]).toEqual(["甲己", "乙庚", "丙辛", "丁壬", "戊癸"]);
    expect([...STEM_CLASHES]).toEqual(["甲庚", "乙辛", "丙壬", "丁癸"]);
    expect(stemFacts("mu").clash).toBeNull();
    expect(stemFacts("gi").combination?.hanja).toBe("甲");
    expect(stemFacts("gap")).toMatchObject({ order: 1, pair: { hanja: "乙" }, combination: { hanja: "己" }, clash: { hanja: "庚" } });
  });

  it("keeps the hidden stems the chart shows, main stem first, matching the ten god's main stem table", () => {
    for (const [branch, stems] of Object.entries(HIDDEN_STEMS)) expect(stems[0], branch).toBe(MAIN_HIDDEN_STEM[branch as keyof typeof MAIN_HIDDEN_STEM]);
    expect(HIDDEN_STEMS.子).toEqual(["癸"]);
    expect(HIDDEN_STEMS.寅).toEqual(["甲", "丙", "戊"]);
    expect(stemFacts("mu").hiddenIn.filter((item) => item.main).map((item) => item.branch.hanja)).toEqual(["辰", "戌"]);
  });

  it("pairs a stem only with branches of its own yin-yang, six pillars each", () => {
    expect(stemFacts("gap").pillars.map((glyph) => glyph.hanja)).toEqual(["子", "寅", "辰", "午", "申", "戌"]);
    expect(stemFacts("gye").pillars.map((glyph) => glyph.hanja)).toEqual(["丑", "卯", "巳", "未", "酉", "亥"]);
  });

  it("reads a stem's ten god for every day stem from the judging table", () => {
    const names = (slug: (typeof STEM_SLUGS)[number]) => stemFacts(slug).byDay.map((item) => TEN_GOD_NAMES[item.tenGod]);
    expect(names("gap")).toEqual(["비견", "겁재", "편인", "정인", "편관", "정관", "편재", "정재", "식신", "상관"]);
    expect(names("gye")).toEqual(["정인", "편인", "정관", "편관", "정재", "편재", "상관", "식신", "겁재", "비견"]);
  });

  it("gives each branch its month, hours and the zodiac relations", () => {
    expect(branchFacts("ja")).toMatchObject({ month: 11, term: "대설", hours: [23, 1], season: "겨울", zodiac: "rat" });
    expect(branchFacts("in")).toMatchObject({ month: 1, term: "입춘", hours: [3, 5] });
    expect(branchFacts("hae")).toMatchObject({ month: 10, hours: [21, 23] });
    const ja = branchFacts("ja");
    const kinds = (list: typeof ja.harmony) => Object.fromEntries(list.map((item) => [item.kind, item.partners.map((glyph) => glyph.hanja)]));
    expect(kinds(ja.harmony)).toEqual({ sixHarmony: ["丑"], threeHarmony: ["辰", "申"], seasonGroup: ["丑", "亥"] });
    expect(kinds(ja.tension)).toEqual({ clash: ["午"], punishment: ["卯"], resentment: ["未"], harm: ["未"], breaking: ["酉"] });
  });

  it("maps chart characters to slugs and back", () => {
    expect(stemSlugOf("辛")).toBe("sin");
    expect(branchSlugOf("申")).toBe("sin");
    expect(stemSlugOf("子")).toBeNull();
    expect(STEM_SLUGS.map((slug) => stemFacts(slug).glyph.hanja).join("")).toBe("甲乙丙丁戊己庚辛壬癸");
    expect(BRANCH_SLUGS.map((slug) => branchFacts(slug).glyph.hanja).join("")).toBe("子丑寅卯辰巳午未申酉戌亥");
  });
});

describe("stem copy", () => {
  it("names the facts the page computes: combination, clash and the examples in the ten god paragraph", () => {
    for (const entry of STEM_ENTRIES) {
      const facts = stemFacts(entry.slug);
      const relations = entry.relations.join(" ");
      // The relations paragraph names each partner with its Hanja, so a wrong partner cannot pass by sharing a syllable.
      if (facts.combination) expect(relations, entry.slug).toContain(`(${facts.combination.hanja})`);
      if (facts.clash) expect(relations, entry.slug).toContain(`(${facts.clash.hanja})`);
      // Every "X 일간에게 … Y" example must match the computed ten god.
      for (const match of entry.tenGods.join(" ").matchAll(/([가-힣]) 일간에게(?: [가-힣]+)?(?:는)? (?:[^,.]*?)(비견|겁재|식신|상관|편재|정재|편관|정관|편인|정인)/g)) {
        const day = facts.byDay.find((item) => item.day.korean === match[1]);
        expect(day && TEN_GOD_NAMES[day.tenGod], `${entry.slug}: ${match[0]}`).toBe(match[2]);
      }
    }
    expect(getStem("gap")?.slug).toBe("gap");
    expect(getStem("nope")).toBeNull();
  });
});

describe("dictionary copy", () => {
  const pages = [
    ...TEN_GODS.map((entry) => ({ slug: entry.slug, text: [entry.lead, ...entry.principle, ...entry.meaning, ...entry.timing, ...entry.flow, ...entry.myths.flatMap((myth) => [myth.claim, myth.answer]), ...entry.pair, ...entry.find] })),
    ...ELEMENT_ENTRIES.map((entry) => ({ slug: entry.slug, text: [entry.lead, ...entry.nature, ...entry.cycle, ...entry.chars, ...entry.count, ...entry.read] })),
    ...STEM_ENTRIES.map((entry) => ({ slug: `stem-${entry.slug}`, text: [entry.lead, ...entry.place, ...entry.cycle, ...entry.tenGods, ...entry.relations, ...entry.find] })),
    { slug: "basics", text: BASICS.steps.flatMap((step) => step.paragraphs) },
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
