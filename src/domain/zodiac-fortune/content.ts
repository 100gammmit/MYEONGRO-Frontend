import { z } from "zod";

import rawContent from "./content/2027.json";
import { ZODIAC_SLUGS, isZodiacSlug } from "./slugs";

export { ZODIAC_SLUGS, isZodiacSlug, zodiacSlugOfYear, type ZodiacSlug } from "./slugs";

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
  hub: z.object({
    title: text,
    description: text,
    summary: z.array(text).length(3),
    finderLead: text,
    yearNote: text,
    signsLead: text,
    limits: z.array(text).min(1),
  }).strict(),
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

export function getZodiacSign(slug: string): ZodiacSign | null {
  return isZodiacSlug(slug) ? ZODIAC_SIGNS[ZODIAC_SLUGS.indexOf(slug)] : null;
}

/** The year's animal by its short name, e.g. "양" for 2027. */
export const ZODIAC_YEAR_ANIMAL_NAME: string = ZODIAC_SIGNS[ZODIAC_SLUGS.indexOf(ZODIAC_YEAR_CONTENT.yearAnimal)].shortName;
