import { describe, expect, it } from "vitest";

import { ZODIAC_SIGNS, ZODIAC_SLUGS, ZODIAC_YEAR_CONTENT, getZodiacSign, zodiacSlugOfYear, type ZodiacSign } from "./content";
import { relationTag, relationsWithYear } from "./relations";
import { ganjiName, pageBirthYears } from "./years";

const SECTIONS = ["basis", "work", "relationship", "money", "body"] as const;
// Words the writing runbook keeps out of the body: vague abstractions, excluded topics and commands.
const FORBIDDEN = /흐름|기운|에너지|삼재|행운|점수|투자|수익|하세요|해야 해요/;
const HANJA = /[㐀-鿿豈-﫿]/;
// "~하면 ~할 수 있어요": a clause ending in 면 (not 면서) that the same sentence closes with 수 있어요.
const IF_THEN_CAN = /[가-힣]+면(?!서)\s[^.!?]*수 있어요/g;

function pageText(sign: ZodiacSign): string[] {
  const common = ZODIAC_YEAR_CONTENT;
  return [sign.summary, ...SECTIONS.map((key) => sign[key]), common.intro, common.ipchunNote, common.commonNote, common.disclaimer];
}

describe("zodiac fortune content", () => {
  it("has all twelve signs in branch order", () => {
    expect(ZODIAC_SIGNS.map((sign) => sign.slug)).toEqual([...ZODIAC_SLUGS]);
    expect(ZODIAC_SIGNS.map((sign) => sign.name)).toEqual([
      "쥐띠", "소띠", "범띠", "토끼띠", "용띠", "뱀띠", "말띠", "양띠", "원숭이띠", "닭띠", "개띠", "돼지띠",
    ]);
    expect(getZodiacSign("tiger")?.name).toBe("범띠");
    expect(getZodiacSign("cat")).toBeNull();
  });

  it("uses the fixed disclaimer shared with the daily card", () => {
    expect(ZODIAC_YEAR_CONTENT.disclaimer).toBe("이 내용은 오락과 자기 성찰을 위한 것으로 전문적인 조언을 대신하지 않아요.");
  });

  it.each(ZODIAC_SIGNS.map((sign) => [sign.name, sign] as const))("%s follows the writing rules", (_, sign) => {
    const texts = pageText(sign);
    for (const value of texts) {
      expect(value).not.toMatch(HANJA);
      expect(value).not.toMatch(FORBIDDEN);
    }
    // The runbook limits the pattern in each sign's own text; the shared frame lines are fixed.
    const ifThen = [sign.summary, ...SECTIONS.map((key) => sign[key])].join(" ").match(IF_THEN_CAN) ?? [];
    expect(ifThen.length).toBeLessThanOrEqual(1);
  });

  it.each(SECTIONS)("opens %s differently for every sign", (key) => {
    const openings = ZODIAC_SIGNS.map((sign) => sign[key].split(/(?<=[.!?])\s/)[0]);
    expect(new Set(openings).size).toBe(ZODIAC_SIGNS.length);
  });

  it("matches the 2027 relation table from the runbook", () => {
    const tags = Object.fromEntries(ZODIAC_SLUGS.map((slug) => [slug, relationTag(relationsWithYear(slug, "sheep"))]));
    expect(tags).toEqual({
      rat: "원진·해",
      ox: "충·형",
      tiger: "",
      rabbit: "삼합",
      dragon: "",
      snake: "방합",
      horse: "육합·방합",
      sheep: "같은 띠",
      monkey: "",
      rooster: "",
      dog: "형·파",
      pig: "삼합",
    });
  });

  it("lists the same birth years as the approved draft", () => {
    expect(pageBirthYears("rat", 2027)).toEqual([1948, 1960, 1972, 1984, 1996, 2008, 2020]);
    expect(pageBirthYears("horse", 2027)).toEqual([1954, 1966, 1978, 1990, 2002, 2014, 2026]);
    expect(pageBirthYears("sheep", 2027)).toEqual([1955, 1967, 1979, 1991, 2003, 2015]);
    expect(pageBirthYears("pig", 2027)).toEqual([1959, 1971, 1983, 1995, 2007, 2019]);
  });

  it("names years and signs by the sexagenary cycle", () => {
    expect(ganjiName(1996)).toBe("병자");
    expect(ganjiName(1948)).toBe("무자");
    expect(ganjiName(2027)).toBe("정미");
    expect(zodiacSlugOfYear(1996)).toBe("rat");
    expect(zodiacSlugOfYear(2027)).toBe("sheep");
    expect(zodiacSlugOfYear(1900)).toBe("rat");
  });
});
