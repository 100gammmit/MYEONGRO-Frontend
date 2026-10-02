import { z } from "zod";

import type { ReadingCreditPricing, ReadingCreditStatus } from "./contracts";

const balanceSchema = z.object({
  free: z.number().int().nonnegative(),
  paid: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
}).strict().refine((balance) => balance.total === balance.free + balance.paid, {
  message: "크레딧 합계가 일치하지 않습니다.",
});

const positiveCost = z.number().int().positive();

const costsSchema = z.object({
  tarot: z.object({
    mind_three_card: positiveCost,
    relationship_three_card: positiveCost,
    choice_five_card: positiveCost,
  }).strict(),
  saju: positiveCost,
}).strict();

const dailyFreeGrantSchema = z.number().int().nonnegative();

const readingCreditStatusSchema = z.object({
  dailyFreeGrant: dailyFreeGrantSchema,
  balance: balanceSchema,
  nextResetAt: z.string().datetime({ offset: true }),
  generationInProgress: z.boolean(),
  costs: costsSchema,
}).strict();

const readingCreditPricingSchema = z.object({
  dailyFreeGrant: dailyFreeGrantSchema,
  costs: costsSchema,
}).strict();

export function parseReadingCreditStatus(input: unknown): ReadingCreditStatus {
  return readingCreditStatusSchema.parse(input);
}

export function parseReadingCreditPricing(input: unknown): ReadingCreditPricing {
  return readingCreditPricingSchema.parse(input);
}
