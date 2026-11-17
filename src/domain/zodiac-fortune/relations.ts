import { ZODIAC_SLUGS, type ZodiacSlug } from "./content";

export type ZodiacRelationKind =
  | "sixHarmony" | "threeHarmony" | "seasonGroup"
  | "clash" | "punishment" | "resentment" | "harm" | "breaking" | "same";

// Branch indexes follow ZODIAC_SLUGS: 0 rat (자) … 11 pig (해).
// The standard relation table from the zodiac writing runbook.
const PAIRS: Record<"sixHarmony" | "clash" | "harm" | "breaking" | "resentment", readonly (readonly [number, number])[]> = {
  sixHarmony: [[0, 1], [2, 11], [3, 10], [4, 9], [5, 8], [6, 7]],
  clash: [[0, 6], [1, 7], [2, 8], [3, 9], [4, 10], [5, 11]],
  harm: [[0, 7], [1, 6], [2, 5], [3, 4], [8, 11], [9, 10]],
  breaking: [[0, 9], [1, 4], [2, 11], [3, 6], [5, 8], [7, 10]],
  resentment: [[0, 7], [1, 6], [2, 9], [3, 8], [4, 11], [5, 10]],
};
const GROUPS: Record<"threeHarmony" | "seasonGroup" | "punishment", readonly (readonly number[])[]> = {
  threeHarmony: [[8, 0, 4], [11, 3, 7], [2, 6, 10], [5, 9, 1]],
  seasonGroup: [[2, 3, 4], [5, 6, 7], [8, 9, 10], [11, 0, 1]],
  punishment: [[2, 5, 8], [1, 10, 7], [0, 3]],
};

// Strength order from the runbook: harmony before caution, and within each the stronger first.
const ORDER: readonly ZodiacRelationKind[] = [
  "same", "sixHarmony", "threeHarmony", "seasonGroup",
  "clash", "punishment", "resentment", "harm", "breaking",
];

export const RELATION_LABELS: Record<ZodiacRelationKind, string> = {
  same: "같은 띠",
  sixHarmony: "육합",
  threeHarmony: "삼합",
  seasonGroup: "방합",
  clash: "충",
  punishment: "형",
  resentment: "원진",
  harm: "해",
  breaking: "파",
};

/** Relation kinds a sign has with the year's animal, strongest first. */
export function relationsWithYear(slug: ZodiacSlug, yearAnimal: ZodiacSlug): ZodiacRelationKind[] {
  const a = ZODIAC_SLUGS.indexOf(slug);
  const b = ZODIAC_SLUGS.indexOf(yearAnimal);
  if (a === b) return ["same"];
  const found = new Set<ZodiacRelationKind>();
  for (const [kind, pairs] of Object.entries(PAIRS) as [ZodiacRelationKind, readonly (readonly [number, number])[]][]) {
    if (pairs.some(([x, y]) => (x === a && y === b) || (x === b && y === a))) found.add(kind);
  }
  for (const [kind, groups] of Object.entries(GROUPS) as [ZodiacRelationKind, readonly (readonly number[])[]][]) {
    if (groups.some((group) => group.includes(a) && group.includes(b))) found.add(kind);
  }
  return ORDER.filter((kind) => found.has(kind));
}

/** The short tag a card shows, e.g. "원진·해"; empty for a sign with no relation. */
export function relationTag(kinds: readonly ZodiacRelationKind[]): string {
  return kinds.map((kind) => RELATION_LABELS[kind]).join("·");
}

/** Signs sharing a three-sign group with the year's animal, for drawing the group on the wheel. */
export function groupWithYear(kind: "threeHarmony" | "seasonGroup" | "punishment", yearAnimal: ZodiacSlug): ZodiacSlug[] {
  const b = ZODIAC_SLUGS.indexOf(yearAnimal);
  const group = GROUPS[kind].find((members) => members.includes(b) && members.length === 3);
  return group ? group.map((index) => ZODIAC_SLUGS[index]) : [];
}
