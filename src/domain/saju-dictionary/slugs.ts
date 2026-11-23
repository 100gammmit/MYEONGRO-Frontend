import type { Element } from "@/domain/saju/exploration";

// Kept apart from the content so the manseryeok result can link a ten god or an element without
// bundling the dictionary's text.

/** The ten gods in judging-table order: 비겁, 식상, 재성, 관성, 인성, each 편/정 pair together. */
export const TEN_GOD_SLUGS = [
  "bigyeon", "geopjae", "siksin", "sanggwan", "pyeonjae",
  "jeongjae", "pyeongwan", "jeonggwan", "pyeonin", "jeongin",
] as const;

export type TenGodSlug = (typeof TEN_GOD_SLUGS)[number];

/** Same Korean names as Backend SajuKoreanTerms, which the manseryeok chart sends as tenGod. */
export const TEN_GOD_NAMES: Record<TenGodSlug, string> = {
  bigyeon: "비견", geopjae: "겁재", siksin: "식신", sanggwan: "상관", pyeonjae: "편재",
  jeongjae: "정재", pyeongwan: "편관", jeonggwan: "정관", pyeonin: "편인", jeongin: "정인",
};

/** Element slugs follow the domain's own keys (exploration.ts, manseryeok display). */
export const ELEMENT_SLUGS = ["wood", "fire", "earth", "metal", "water"] as const satisfies readonly Element[];

export type ElementSlug = (typeof ELEMENT_SLUGS)[number];

export function isTenGodSlug(value: string): value is TenGodSlug {
  return (TEN_GOD_SLUGS as readonly string[]).includes(value);
}

export function isElementSlug(value: string): value is ElementSlug {
  return (ELEMENT_SLUGS as readonly string[]).includes(value);
}

/** The dictionary slug for a ten god name from a manseryeok chart, e.g. "상관" → "sanggwan". */
export function tenGodSlugOf(name: string | null | undefined): TenGodSlug | null {
  if (!name) return null;
  return TEN_GOD_SLUGS.find((slug) => TEN_GOD_NAMES[slug] === name) ?? null;
}

export const DICTIONARY_PATH = "/saju/dictionary";

export const BASICS_PATH = `${DICTIONARY_PATH}/basics`;

export function tenGodPath(slug: TenGodSlug): string {
  return `${DICTIONARY_PATH}/ten-gods/${slug}`;
}

export function elementPath(slug: ElementSlug): string {
  return `${DICTIONARY_PATH}/elements/${slug}`;
}

/** The ten stems in order. Paths split stems/ and branches/, so 辛 and 申 may both be "sin". */
export const STEM_SLUGS = ["gap", "eul", "byeong", "jeong", "mu", "gi", "gyeong", "sin", "im", "gye"] as const;
export type StemSlug = (typeof STEM_SLUGS)[number];
const STEM_HANJA = ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"] as const;

/** The twelve branches in order, 子 first, the same order as the zodiac signs. */
export const BRANCH_SLUGS = ["ja", "chuk", "in", "myo", "jin", "sa", "o", "mi", "sin", "yu", "sul", "hae"] as const;
export type BranchSlug = (typeof BRANCH_SLUGS)[number];
const BRANCH_HANJA = ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"] as const;

export function isStemSlug(value: string): value is StemSlug {
  return (STEM_SLUGS as readonly string[]).includes(value);
}

export function isBranchSlug(value: string): value is BranchSlug {
  return (BRANCH_SLUGS as readonly string[]).includes(value);
}

export function stemHanja(slug: StemSlug): string {
  return STEM_HANJA[STEM_SLUGS.indexOf(slug)];
}

export function branchHanja(slug: BranchSlug): string {
  return BRANCH_HANJA[BRANCH_SLUGS.indexOf(slug)];
}

/** The dictionary slug for a stem character from a chart, e.g. "甲" → "gap". */
export function stemSlugOf(hanja: string | null | undefined): StemSlug | null {
  const index = hanja ? (STEM_HANJA as readonly string[]).indexOf(hanja) : -1;
  return index < 0 ? null : STEM_SLUGS[index];
}

/** The dictionary slug for a branch character from a chart, e.g. "子" → "ja". */
export function branchSlugOf(hanja: string | null | undefined): BranchSlug | null {
  const index = hanja ? (BRANCH_HANJA as readonly string[]).indexOf(hanja) : -1;
  return index < 0 ? null : BRANCH_SLUGS[index];
}

export function stemPath(slug: StemSlug): string {
  return `${DICTIONARY_PATH}/stems/${slug}`;
}

export function branchPath(slug: BranchSlug): string {
  return `${DICTIONARY_PATH}/branches/${slug}`;
}
