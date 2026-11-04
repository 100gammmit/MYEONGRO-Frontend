import { z } from "zod";
import { readingModeSchema } from "@/domain/reading/reading-mode";
import { minimalCalculationSnapshotSchema, type SajuEvidenceKey } from "./result";
import { monthlyCalendarSchema } from "./monthly-calendar";

const text = z.string().trim().min(1);
const section = z.object({ heading: text, body: text, evidenceKeys: z.array(text).min(1) }).strict();
const snapshotSchema = minimalCalculationSnapshotSchema.extend({
  monthlyCalendar: monthlyCalendarSchema,
  annualFortune: z.object({ year: z.number().int(), ganZhi: text, stemTenGod: text.optional() }).strict(),
});
type Calendar = z.infer<typeof monthlyCalendarSchema>;
export type AnnualPeriod = Calendar["months"][number]["periods"][number] & { id: string };

// Only merge frozen, adjacent slices. This is a view of the calculation, not new astrology.
export function annualCalendar(calendar: Calendar) {
  const periods: AnnualPeriod[] = [];
  const months = calendar.months.map((month) => ({ month: month.month, periodIds: month.periods.map((slice) => {
    const previous = periods.at(-1);
    if (previous && previous.endExclusive === slice.startInclusive
      && previous.yearGanZhi === slice.yearGanZhi && previous.monthGanZhi === slice.monthGanZhi
      && previous.stemTenGod === slice.stemTenGod) {
      previous.endExclusive = slice.endExclusive;
      return previous.id;
    }
    const id = `p${String(periods.length + 1).padStart(2, "0")}`;
    periods.push({ ...slice, id });
    return id;
  }) }));
  return { months, periods };
}

export const ANNUAL_BASE_EVIDENCE: SajuEvidenceKey[] = ["pillars", "dayMaster", "elementBalance", "tenGods", "interactions", "currentLuckCycle", "annualFlow", "limitations", "uncertainty"];

const recordSchema = z.object({
  id: text, kind: z.literal("saju"), schemaVersion: z.literal(7), status: z.literal("completed"),
  input: z.object({ reportType: z.literal("annual_monthly"), targetYear: z.number().int(), calculationSnapshot: snapshotSchema }).strict(),
  result: z.object({
    reportType: z.literal("annual_monthly"), detailLevel: z.enum(["full", "brief"]), targetYear: z.number().int(),
    readingMode: readingModeSchema, questionRedirected: z.boolean(), title: text,
    annualOverview: section,
    months: z.array(section.extend({ month: z.number().int().min(1).max(12) })).length(12),
    periods: z.array(section.extend({ periodId: text })),
    questionReading: section.nullable(), summary: text, disclaimer: text,
  }).strip(),
}).passthrough().superRefine((view, context) => {
  const { result, input } = view;
  const snapshot = input.calculationSnapshot;
  const fail = () => context.addIssue({ code: z.ZodIssueCode.custom, message: "연간 리포트의 계산 근거가 일치하지 않습니다." });
  // Zod length failures are dirty, not aborted: refinements still run on these arrays.
  // Reject incomplete calendars/results before deriving IDs or indexing corresponding months.
  if (result.months.length !== 12 || snapshot.monthlyCalendar.months.length !== 12
    || snapshot.monthlyCalendar.months.some((month) => month.periods.length !== 2)) {
    fail();
    return;
  }
  const calendar = annualCalendar(snapshot.monthlyCalendar);
  if ([snapshot.targetYear, snapshot.monthlyCalendar.targetYear, snapshot.annualFortune.year, result.targetYear].some((year) => year !== input.targetYear)
    || result.detailLevel !== (snapshot.dayMaster ? "full" : "brief")
    || (result.questionRedirected && (result.readingMode === "standard" || !result.questionReading))) fail();
  if (!snapshot.dayMaster && (snapshot.annualFortune.stemTenGod || Object.values(snapshot.pillars).some((pillar) => pillar?.stemTenGod)
    || snapshot.monthlyCalendar.months.some((month) => month.periods.some((period) => period.stemTenGod)))) fail();
  const base = new Set<string>(["annualFlow"]);
  if (Object.values(snapshot.pillars).some(Boolean)) base.add("pillars");
  if (snapshot.dayMaster) base.add("dayMaster");
  if (Object.keys(snapshot.fiveElements).length) base.add("elementBalance");
  if (snapshot.dayMaster && Object.values(snapshot.pillars).some((pillar) => pillar?.stemTenGod)) base.add("tenGods");
  if (snapshot.relations.length) base.add("interactions");
  if (snapshot.currentLuckCycle) base.add("currentLuckCycle");
  if (snapshot.limitations.length) base.add("limitations");
  if (snapshot.uncertainty.varyingFields.length) base.add("uncertainty");
  const all = new Set([...base, ...calendar.periods.map((period) => `monthlyFlow.${period.id}`)]);
  const check = (keys: string[], allowed: Set<string>, required: string[] = []) => {
    if (new Set(keys).size !== keys.length || keys.some((key) => !allowed.has(key)) || required.some((key) => !keys.includes(key))) fail();
  };
  check(result.annualOverview.evidenceKeys, all, ["annualFlow"]);
  if (result.questionReading) check(result.questionReading.evidenceKeys, all);
  result.months.forEach((month, index) => {
    if (month.month !== index + 1) fail();
    const expected = calendar.months[index].periodIds.map((id) => `monthlyFlow.${id}`);
    check(month.evidenceKeys, new Set([...base, ...expected]), expected);
  });
  if (result.periods.length !== (result.detailLevel === "brief" ? 0 : calendar.periods.length)) fail();
  result.periods.forEach((period, index) => {
    const expected = calendar.periods[index]?.id;
    if (period.periodId !== expected) fail();
    check(period.evidenceKeys, new Set([...base, `monthlyFlow.${expected}`]), [`monthlyFlow.${expected}`]);
  });
});

export type SajuAnnualReadingView = z.infer<typeof recordSchema>;
export function parseSajuAnnualReadingView(value: unknown): SajuAnnualReadingView | null {
  const parsed = recordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
