import { z } from "zod";

const baseInputSchema = z.object({
  locale: z.string().min(1),
  question: z.string().min(1),
});

const tarotCardSchema = z
  .object({
    name: z.string().min(1),
    position: z.string().min(1),
    reversed: z.boolean(),
  })
  .strict();

const tarotSubjectSchema = z.object({
  kind: z.literal("tarot"),
  cards: z.array(tarotCardSchema).min(1),
});

const sajuSubjectSchema = z.object({
  kind: z.literal("saju"),
  profile: z
    .object({
      birthDate: z.string().min(1),
      birthTime: z.string().min(1).optional(),
      calendarType: z.enum(["solar", "lunar"]),
      gender: z.enum(["female", "male", "unspecified"]),
      pillars: z
        .object({
          year: z.string().min(1),
          month: z.string().min(1),
          day: z.string().min(1),
          hour: z.string().min(1),
        })
        .strict(),
    })
    .strict(),
});

const initialTierSchema = z.object({
  tier: z.enum(["free", "paid"]),
});

const followUpTierSchema = z.object({
  tier: z.literal("followup"),
  previousReading: z
    .object({
      title: z.string().min(1),
      summary: z.string().min(1),
    })
    .strict(),
});

export const readingGenerationInputSchema = z.union([
  baseInputSchema.merge(tarotSubjectSchema).merge(initialTierSchema).strict(),
  baseInputSchema.merge(sajuSubjectSchema).merge(initialTierSchema).strict(),
  baseInputSchema.merge(tarotSubjectSchema).merge(followUpTierSchema).strict(),
  baseInputSchema.merge(sajuSubjectSchema).merge(followUpTierSchema).strict(),
]);

export const readingGenerationOutputSchema = z
  .object({
    title: z.string().min(1),
    summary: z.string().min(1),
    sections: z
      .array(
        z
          .object({
            heading: z.string().min(1),
            body: z.string().min(1),
          })
          .strict(),
      )
      .min(1),
    guidance: z.array(z.string().min(1)).min(1),
    disclaimer: z.string().min(1),
  })
  .strict();

export type ReadingGenerationInput = z.infer<typeof readingGenerationInputSchema>;
export type ReadingGenerationOutput = z.infer<typeof readingGenerationOutputSchema>;

export interface ReadingGenerator {
  generate(input: ReadingGenerationInput): Promise<ReadingGenerationOutput>;
}
