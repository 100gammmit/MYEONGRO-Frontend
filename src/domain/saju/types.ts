import { z } from "zod";

import { SajuInputValidationError } from "./errors";

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

const birthDateSchema = z.string().regex(DATE_PATTERN).refine((value) => {
  const match = DATE_PATTERN.exec(value);
  if (!match) {
    return false;
  }

  const [, yearText, monthText, dayText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}, "birthDate must be a real Gregorian date in YYYY-MM-DD format");

const sajuBirthInputSchema = z.object({
  calendarType: z.enum(["solar", "lunar"]),
  birthDate: birthDateSchema,
  birthTime: z.string().regex(TIME_PATTERN).optional(),
  gender: z.enum(["female", "male", "unspecified"]),
});

export type SajuBirthInput = z.infer<typeof sajuBirthInputSchema>;
export type CalendarType = SajuBirthInput["calendarType"];
export type Gender = SajuBirthInput["gender"];

export interface FourPillars {
  year: string;
  month: string;
  day: string;
  hour: string;
}

export function parseSajuBirthInput(input: unknown): SajuBirthInput {
  const result = sajuBirthInputSchema.safeParse(input);
  if (!result.success) {
    throw new SajuInputValidationError(
      result.error.issues.map((issue) => issue.message).join("; "),
    );
  }

  return result.data;
}
