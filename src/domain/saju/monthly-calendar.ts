import { z } from "zod";

const timestamp = z.string().regex(/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d\+09:00$/)
  .refine((value) => Number.isFinite(Date.parse(value)), "잘못된 적용 시각입니다.");
export const monthlyCalendarSchema = z.object({
  calculationVersion: z.literal("saju-monthly-ko-v1"),
  timeZone: z.literal("Asia/Seoul"),
  targetYear: z.number().int().min(1900).max(2100),
  months: z.array(z.object({
    month: z.number().int().min(1).max(12),
    periods: z.array(z.object({
      startInclusive: timestamp, endExclusive: timestamp,
      yearGanZhi: z.string().min(1), monthGanZhi: z.string().min(1), stemTenGod: z.string().min(1).optional(),
    }).strict()).length(2),
  }).strict()).length(12),
}).strict().superRefine((calendar, context) => {
  calendar.months.forEach((month, index) => {
    const expectedStart = `${calendar.targetYear}-${String(index + 1).padStart(2, "0")}-01T00:00:00+09:00`;
    const expectedEnd = index === 11 ? `${calendar.targetYear + 1}-01-01T00:00:00+09:00`
      : `${calendar.targetYear}-${String(index + 2).padStart(2, "0")}-01T00:00:00+09:00`;
    const [first, second] = month.periods;
    if (month.month !== index + 1 || !first || !second
      || first.startInclusive !== expectedStart || second.endExclusive !== expectedEnd
      || first.endExclusive !== second.startInclusive
      || Date.parse(first.startInclusive) >= Date.parse(first.endExclusive)
      || Date.parse(second.startInclusive) >= Date.parse(second.endExclusive)) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: ["months", index], message: "월별 적용 구간이 올바르지 않습니다." });
    }
  });
});

export function getSajuCurrentYear(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en", { year: "numeric", timeZone: "Asia/Seoul" }).format(now));
}
