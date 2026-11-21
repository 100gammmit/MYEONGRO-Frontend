import { ELEMENT_NAMES, ELEMENT_ORDER } from "@/domain/manseryeok/display";
import { CONTROLS, ELEMENTS, GENERATES, symbolInfo, type Element } from "@/domain/saju/exploration";

import { TEN_GOD_NAMES, TEN_GOD_SLUGS, type ElementSlug, type TenGodSlug } from "./slugs";

/**
 * The judging table every dictionary page stands on: the day stem's element relation picks the row,
 * matching yin-yang picks 편 (same) or 정 (different). Examples and tables are computed from this,
 * so the prose can be checked against it instead of trusted.
 */
export const TEN_GOD_GROUPS = [
  { name: "비겁", relation: "같은 오행", gloss: "나와 같은 기운" },
  { name: "식상", relation: "내가 낳는 오행", gloss: "내가 낳는 기운" },
  { name: "재성", relation: "내가 극하는 오행", gloss: "내가 다스리는 기운" },
  { name: "관성", relation: "나를 극하는 오행", gloss: "나를 다스리는 기운" },
  { name: "인성", relation: "나를 낳는 오행", gloss: "나를 돕는 기운" },
] as const;

export type TenGodGroup = (typeof TEN_GOD_GROUPS)[number];

export const STEMS = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;
export const BRANCHES = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

/** Each branch's main hidden stem (지장간 본기); the backend lists it first and the chart's branch ten god follows it. */
export const MAIN_HIDDEN_STEM: Record<(typeof BRANCHES)[number], (typeof STEMS)[number]> = {
  子: "癸", 丑: "己", 寅: "甲", 卯: "乙", 辰: "戊", 巳: "丙", 午: "丁", 未: "己", 申: "庚", 酉: "辛", 戌: "戊", 亥: "壬",
};

export interface Glyph {
  readonly hanja: string;
  readonly korean: string;
  readonly element: Element;
  readonly yang: boolean;
}

function stem(hanja: string): Glyph {
  const info = symbolInfo(hanja, "stem");
  if (!info) throw new Error(`Unknown stem: ${hanja}`);
  return info;
}

function branch(hanja: string): Glyph {
  const info = symbolInfo(hanja, "branch");
  if (!info) throw new Error(`Unknown branch: ${hanja}`);
  return info;
}

/** Row of the judging table for another element seen from the day element. */
export function relationIndex(day: Element, other: Element): number {
  if (day === other) return 0;
  if (GENERATES[day] === other) return 1;
  if (CONTROLS[day] === other) return 2;
  if (CONTROLS[other] === day) return 3;
  return 4;
}

export function groupOf(slug: TenGodSlug): TenGodGroup {
  return TEN_GOD_GROUPS[Math.floor(TEN_GOD_SLUGS.indexOf(slug) / 2)];
}

/** 비견·식신·편재·편관·편인 share the day stem's yin-yang; their pairs do not. */
export function samePolarity(slug: TenGodSlug): boolean {
  return TEN_GOD_SLUGS.indexOf(slug) % 2 === 0;
}

export function pairOf(slug: TenGodSlug): TenGodSlug {
  const index = TEN_GOD_SLUGS.indexOf(slug);
  return TEN_GOD_SLUGS[index % 2 === 0 ? index + 1 : index - 1];
}

/** The ten god another stem is to the day stem, e.g. (甲, 丁) → sanggwan. */
export function tenGodOf(dayStem: string, otherStem: string): TenGodSlug {
  const day = stem(dayStem);
  const other = stem(otherStem);
  return TEN_GOD_SLUGS[relationIndex(day.element, other.element) * 2 + (day.yang === other.yang ? 0 : 1)];
}

export interface TenGodExample {
  readonly dayStem: Glyph;
  readonly stem: Glyph;
  readonly branches: readonly Glyph[];
}

/** For one day stem: the stem that is this ten god and the branches whose main hidden stem is. */
export function tenGodExample(slug: TenGodSlug, dayStem: string): TenGodExample {
  const found = STEMS.find((candidate) => tenGodOf(dayStem, candidate) === slug);
  if (!found) throw new Error(`No ${slug} stem for ${dayStem}`);
  return {
    dayStem: stem(dayStem),
    stem: stem(found),
    branches: BRANCHES.filter((candidate) => tenGodOf(dayStem, MAIN_HIDDEN_STEM[candidate]) === slug).map(branch),
  };
}

/** The same ten god for every day stem, for the "일간별로 보면" table. */
export function tenGodByDayStem(slug: TenGodSlug): readonly TenGodExample[] {
  return STEMS.map((dayStem) => tenGodExample(slug, dayStem));
}

export interface ElementFacts {
  readonly name: string;
  readonly season: string;
  readonly direction: string;
  readonly stems: readonly Glyph[];
  readonly branches: readonly Glyph[];
  readonly generatedBy: Element;
  readonly generates: Element;
  readonly controls: Element;
  readonly controlledBy: Element;
}

export function elementFacts(slug: ElementSlug): ElementFacts {
  const entries = Object.entries(GENERATES) as [Element, Element][];
  const controlled = Object.entries(CONTROLS) as [Element, Element][];
  return {
    name: ELEMENT_NAMES[slug],
    season: ELEMENTS[slug].season,
    direction: ELEMENTS[slug].direction,
    stems: STEMS.map(stem).filter((glyph) => glyph.element === slug),
    branches: BRANCHES.map(branch).filter((glyph) => glyph.element === slug),
    generatedBy: entries.find(([, child]) => child === slug)![0],
    generates: GENERATES[slug],
    controls: CONTROLS[slug],
    controlledBy: controlled.find(([, target]) => target === slug)![0],
  };
}

/** Which ten-god group this element is for a day stem of each element (목 일간에게 목은 비겁 …). */
export function elementAsGroup(slug: ElementSlug): readonly { day: Element; group: TenGodGroup }[] {
  return ELEMENT_ORDER.map((day) => ({ day, group: TEN_GOD_GROUPS[relationIndex(day, slug)] }));
}

export function tenGodName(slug: TenGodSlug): string {
  return TEN_GOD_NAMES[slug];
}
