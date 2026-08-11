import { z } from "zod";

const textSchema = z.string().trim().min(1);

export const readingDeclineReasonSchema = z.enum([
  "CRISIS_OR_IMMEDIATE_DANGER",
  "MEDICAL_DECISION",
  "LEGAL_DECISION",
  "FINANCIAL_DECISION",
  "HARMFUL_OR_ILLEGAL_ACTION",
]);

const declinedResultSchema = z.object({
  resultType: z.literal("declined"),
  reasonCode: readingDeclineReasonSchema,
  title: textSchema,
  message: textSchema,
  guidance: z.array(textSchema).min(1),
  disclaimer: textSchema,
}).strict();

const declinedReadingViewSchema = z.object({
  id: textSchema,
  kind: z.enum(["tarot", "saju"]),
  status: z.literal("completed"),
  input: z.record(z.string(), z.unknown()),
  result: declinedResultSchema,
}).passthrough();

export type DeclinedReadingView = z.infer<typeof declinedReadingViewSchema>;

export function parseDeclinedReadingView(value: unknown): DeclinedReadingView | null {
  const parsed = declinedReadingViewSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
