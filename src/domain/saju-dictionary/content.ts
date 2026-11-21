import { z } from "zod";

import rawDictionary from "./content/dictionary.json";
import rawElements from "./content/elements.json";
import rawTenGods from "./content/ten-gods.json";
import { STEMS } from "./rules";
import { ELEMENT_SLUGS, TEN_GOD_NAMES, TEN_GOD_SLUGS, isElementSlug, isTenGodSlug, type ElementSlug, type TenGodSlug } from "./slugs";

const text = z.string().trim().min(1);
const paragraphs = z.array(text).min(1);

const tenGodSchema = z.object({
  slug: z.enum(TEN_GOD_SLUGS),
  name: text,
  hanja: text,
  exampleDayStem: z.enum(STEMS),
  lead: text,
  principle: paragraphs,
  meaning: paragraphs,
  timing: paragraphs,
  flow: paragraphs,
  myths: z.array(z.object({ claim: text, answer: text }).strict()).min(1),
  pair: paragraphs,
  find: paragraphs,
  related: z.array(z.enum(TEN_GOD_SLUGS)).min(1),
}).strict();

const elementSchema = z.object({
  slug: z.enum(ELEMENT_SLUGS),
  hanja: text,
  color: text,
  lead: text,
  nature: paragraphs,
  cycle: paragraphs,
  chars: paragraphs,
  count: paragraphs,
  read: paragraphs,
  related: z.array(z.enum(ELEMENT_SLUGS)).min(1),
}).strict();

const dictionarySchema = z.object({
  editorialNote: text,
  disclaimer: text,
  hub: z.object({
    title: text,
    description: text,
    tenGodsLead: paragraphs,
    elementsLead: paragraphs,
  }).strict(),
}).strict();

export type TenGodEntry = z.infer<typeof tenGodSchema>;
export type ElementEntry = z.infer<typeof elementSchema>;
export type DictionaryCopy = z.infer<typeof dictionarySchema>;

export const TEN_GODS: readonly TenGodEntry[] = z.array(tenGodSchema).length(TEN_GOD_SLUGS.length).parse(rawTenGods);
export const ELEMENT_ENTRIES: readonly ElementEntry[] = z.array(elementSchema).length(ELEMENT_SLUGS.length).parse(rawElements);
export const DICTIONARY: DictionaryCopy = dictionarySchema.parse(rawDictionary);

// Every entry appears once, in table order, with the backend's name, and never lists itself as related.
TEN_GODS.forEach((entry, index) => {
  if (entry.slug !== TEN_GOD_SLUGS[index]) throw new Error(`십성 본문 순서가 올바르지 않습니다: ${entry.slug}`);
  if (entry.name !== TEN_GOD_NAMES[entry.slug]) throw new Error(`십성 이름이 계산 결과와 다릅니다: ${entry.slug}`);
  if (entry.related.includes(entry.slug)) throw new Error(`십성이 자기 자신을 관련 항목으로 둡니다: ${entry.slug}`);
});
ELEMENT_ENTRIES.forEach((entry, index) => {
  if (entry.slug !== ELEMENT_SLUGS[index]) throw new Error(`오행 본문 순서가 올바르지 않습니다: ${entry.slug}`);
  if (entry.related.includes(entry.slug)) throw new Error(`오행이 자기 자신을 관련 항목으로 둡니다: ${entry.slug}`);
});

export function getTenGod(slug: string): TenGodEntry | null {
  return isTenGodSlug(slug) ? TEN_GODS[TEN_GOD_SLUGS.indexOf(slug)] : null;
}

export function getElement(slug: string): ElementEntry | null {
  return isElementSlug(slug) ? ELEMENT_ENTRIES[ELEMENT_SLUGS.indexOf(slug)] : null;
}

export type { ElementSlug, TenGodSlug };
