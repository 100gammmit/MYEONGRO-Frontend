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
