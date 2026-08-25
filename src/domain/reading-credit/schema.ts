import { z } from "zod";

import type { ReadingCreditStatus } from "./contracts";

const balanceSchema = z.object({
  free: z.number().int().nonnegative(),
  paid: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
}).strict().refine((balance) => balance.total === balance.free + balance.paid, {
  message: "크레딧 합계가 일치하지 않습니다.",
});

const positiveCost = z.number().int().positive();

const readingCreditStatusSchema = z.object({
  dailyFreeGrant: z.number().int().nonnegative(),
  balance: balanceSchema,
  nextResetAt: z.string().datetime({ offset: true }),
  generationInProgress: z.boolean(),
  costs: z.object({
    tarot: z.object({
      mind_three_card: positiveCost,
      relationship_three_card: positiveCost,
      choice_five_card: positiveCost,
    }).strict(),
    saju: positiveCost,
  }).strict(),
}).strict();

export function parseReadingCreditStatus(input: unknown): ReadingCreditStatus {
  return readingCreditStatusSchema.parse(input);
}
