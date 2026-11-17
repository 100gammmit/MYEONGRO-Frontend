// Kept apart from the content so client code (the year finder) can use the sign order without
// bundling the year's text.

// The twelve signs in branch order, 자 (rat) first. The order also drives the wheel and the nav.
export const ZODIAC_SLUGS = [
  "rat", "ox", "tiger", "rabbit", "dragon", "snake",
  "horse", "sheep", "monkey", "rooster", "dog", "pig",
] as const;

export type ZodiacSlug = (typeof ZODIAC_SLUGS)[number];

export function isZodiacSlug(value: string): value is ZodiacSlug {
  return (ZODIAC_SLUGS as readonly string[]).includes(value);
}

/** The sign of a calendar year counted from 입춘, e.g. 1996 → rat. */
export function zodiacSlugOfYear(year: number): ZodiacSlug {
  return ZODIAC_SLUGS[(((year - 4) % 12) + 12) % 12];
}
