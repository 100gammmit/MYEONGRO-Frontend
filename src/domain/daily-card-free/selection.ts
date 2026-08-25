import { z } from "zod";

import {
  DAILY_CARD_CONTENT_VERSION,
  DAILY_CARD_VARIANT_COUNT,
  getDailyCardContent,
} from "./content";

const selectionResponseSchema = z.object({
  selection: z.object({
    dateKst: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    cardId: z.string().min(1),
    variantIndex: z.number().int().min(0).max(DAILY_CARD_VARIANT_COUNT - 1),
    contentVersion: z.literal(DAILY_CARD_CONTENT_VERSION),
  }).strict(),
}).strict().refine(
  ({ selection }) => getDailyCardContent(selection.cardId, selection.variantIndex) !== null,
  { message: "지원하지 않는 오늘의 카드입니다." },
);

export function parseDailyCardSelectionResponse(input: unknown) {
  return selectionResponseSchema.parse(input).selection;
}
