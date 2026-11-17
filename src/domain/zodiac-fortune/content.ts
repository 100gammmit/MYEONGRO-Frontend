import { z } from "zod";

import rawContent from "./content/2027.json";

// The twelve signs in branch order, 자 (rat) first. The order also drives the wheel and the nav.
export const ZODIAC_SLUGS = [
  "rat", "ox", "tiger", "rabbit", "dragon", "snake",
  "horse", "sheep", "monkey", "rooster", "dog", "pig",
] as const;

export type ZodiacSlug = (typeof ZODIAC_SLUGS)[number];

const text = z.string().trim().min(1);

const signSchema = z.object({
  slug: z.enum(ZODIAC_SLUGS),
  name: text,
  shortName: text,
  summary: text,
  basis: text,
  work: text,
  relationship: text,
  money: text,
  body: text,
}).strict();

const yearSchema = z.object({
  year: z.number().int().min(2026).max(2099),
  yearName: text,
  yearNameWithHanja: text,
  yearAnimal: z.enum(ZODIAC_SLUGS),
  intro: text,
  ipchunNote: text,
  commonNote: text,
  disclaimer: text,
  editorialNote: text,
  signs: z.array(signSchema).length(ZODIAC_SLUGS.length),
}).strict();

export type ZodiacSign = z.infer<typeof signSchema>;
export type ZodiacYearContent = z.infer<typeof yearSchema>;

export const ZODIAC_YEAR_CONTENT: ZodiacYearContent = yearSchema.parse(rawContent);

// Every sign appears exactly once and in branch order, so index lookups stay meaningful.
ZODIAC_YEAR_CONTENT.signs.forEach((sign, index) => {
  if (sign.slug !== ZODIAC_SLUGS[index]) {
    throw new Error(`띠별 운세 본문 순서가 올바르지 않습니다: ${sign.slug}`);
  }
});

export const ZODIAC_SIGNS: readonly ZodiacSign[] = ZODIAC_YEAR_CONTENT.signs;

export function isZodiacSlug(value: string): value is ZodiacSlug {
  return (ZODIAC_SLUGS as readonly string[]).includes(value);
}

export function getZodiacSign(slug: string): ZodiacSign | null {
  return isZodiacSlug(slug) ? ZODIAC_SIGNS[ZODIAC_SLUGS.indexOf(slug)] : null;
}

/** The sign of a calendar year counted from 입춘, e.g. 1996 → rat. */
export function zodiacSlugOfYear(year: number): ZodiacSlug {
  return ZODIAC_SLUGS[(((year - 4) % 12) + 12) % 12];
}
