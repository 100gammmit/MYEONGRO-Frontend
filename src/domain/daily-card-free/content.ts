import { z } from "zod";

import { MAJOR_ARCANA } from "@/domain/tarot";
import rawContent from "./content/daily-one-card-static-v1.json";

export const DAILY_CARD_CONTENT_VERSION = "daily-one-card-static-v1";
export const DAILY_CARD_VARIANT_COUNT = 6;

const contentSchema = z.object({
  cardId: z.string().min(1),
  variantIndex: z.number().int().min(0).max(DAILY_CARD_VARIANT_COUNT - 1),
  title: z.string().min(1),
  today: z.object({
    heading: z.string().min(1),
    body: z.string().min(1),
  }).strict(),
  guidance: z.tuple([z.string().min(1)]),
  disclaimer: z.string().min(1),
}).strict();

export interface DailyCardContent extends z.infer<typeof contentSchema> {
  readonly cardName: string;
}

const cardNames = new Map<string, string>(
  MAJOR_ARCANA.map((card) => [card.id, card.name]),
);
const content = new Map<string, DailyCardContent>();

for (const value of z.array(contentSchema).parse(rawContent)) {
  const cardName = cardNames.get(value.cardId);
  const key = `${value.cardId}:${value.variantIndex}`;
  if (!cardName || content.has(key)) {
    throw new Error("오늘의 한 장 정적 콘텐츠 식별자가 올바르지 않습니다.");
  }
  content.set(key, { ...value, cardName });
}

if (content.size !== MAJOR_ARCANA.length * DAILY_CARD_VARIANT_COUNT) {
  throw new Error("오늘의 한 장 정적 콘텐츠 구성이 올바르지 않습니다.");
}
for (const card of MAJOR_ARCANA) {
  for (let variantIndex = 0; variantIndex < DAILY_CARD_VARIANT_COUNT; variantIndex += 1) {
    if (!content.has(`${card.id}:${variantIndex}`)) {
      throw new Error("오늘의 한 장 정적 콘텐츠가 누락되었습니다.");
    }
  }
}

export function getDailyCardContent(
  cardId: string,
  variantIndex: number,
): DailyCardContent | null {
  return content.get(`${cardId}:${variantIndex}`) ?? null;
}
