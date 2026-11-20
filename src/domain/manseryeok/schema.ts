import { z } from "zod";

import { monthlyCalendarSchema } from "@/domain/saju/monthly-calendar";

// Mirrors Backend ManseryeokChart (schemaVersion 1). Strict, so a contract change fails loudly
// instead of drawing a half-understood chart.
const symbolSchema = z.object({ hanja: z.string().min(1), korean: z.string().min(1) }).strict();
const positions = ["year", "month", "day", "time"] as const;
const byPosition = <T extends z.ZodTypeAny>(value: T) => z.object({
  year: value, month: value, day: value, time: value,
}).strict();

const chartPillarSchema = z.object({
  ganZhi: symbolSchema,
  stem: symbolSchema,
  branch: symbolSchema,
  stemTenGod: z.string().min(1).nullable(),
}).strict();

const hiddenStemSchema = z.object({ stem: symbolSchema, tenGod: z.string().min(1).nullable() }).strict();

const relationSchema = z.object({
  type: z.string().min(1),
  members: z.array(z.object({ position: z.enum(positions), symbol: symbolSchema }).strict()).min(2),
}).strict();

const capabilitySchema = z.object({
  status: z.enum(["available", "limited", "unavailable"]),
  fields: z.array(z.string()),
  reasonCodes: z.array(z.string()),
}).strict();

const luckPeriodSchema = z.object({
  startYear: z.number().int(),
  endYear: z.number().int(),
  startAge: z.number().int(),
  endAge: z.number().int(),
  ganZhi: z.string().min(1),
}).strict();

export const manseryeokChartSchema = z.object({
  schemaVersion: z.literal(1),
  calculationVersion: z.string().min(1),
  engine: z.string().min(1),
  engineVersion: z.string().min(1),
  timeCorrectionVersion: z.string().min(1),
  timeZoneRulesVersion: z.string().min(1),
  cityCatalogVersion: z.string().min(1),
  referenceYear: z.number().int(),
  appliedOptions: z.object({
    dayBoundary: z.enum(["MIDNIGHT", "HOUR_23"]),
    equationOfTime: z.boolean(),
    coordinateSource: z.enum(["reference", "province", "city"]),
    longitude: z.number(),
    birthTimeKnown: z.boolean(),
  }).strict(),
  chart: z.object({
    pillars: byPosition(chartPillarSchema.nullable()),
    dayMaster: symbolSchema.nullable(),
  }).strict(),
  fiveElements: z.object({
    wood: z.number().int().nonnegative(),
    fire: z.number().int().nonnegative(),
    earth: z.number().int().nonnegative(),
    metal: z.number().int().nonnegative(),
    water: z.number().int().nonnegative(),
  }).strict(),
  relations: z.object({
    status: z.enum(["available", "limited"]),
    values: z.array(relationSchema),
    reasonCodes: z.array(z.string()),
  }).strict(),
  hiddenStems: byPosition(z.array(hiddenStemSchema).min(1).nullable()),
  twelveStages: byPosition(symbolSchema.nullable()),
  voids: z.object({ day: symbolSchema.nullable(), year: symbolSchema.nullable() }).strict(),
  luckCycle: z.object({
    precise: z.object({
      direction: z.enum(["forward", "backward"]),
      startDate: z.string().min(1),
      startAgeYears: z.number().int().nonnegative(),
      startAgeMonths: z.number().int().nonnegative(),
      periods: z.array(luckPeriodSchema).min(1),
    }).strict(),
    integerStartAge: z.number().int().nonnegative(),
    integerMethod: z.string().min(1),
    // The display strip; precise only feeds the start-point line.
    periods: z.array(z.object({
      startYear: z.number().int(),
      endYear: z.number().int(),
      startAge: z.number().int(),
      endAge: z.number().int(),
      ganZhi: symbolSchema,
      stemTenGod: z.string().min(1).nullable(),
    }).strict()).min(1),
  }).strict().nullable(),
  annualFlows: z.array(z.object({
    year: z.number().int(),
    ganZhi: symbolSchema,
    stemTenGod: z.string().min(1).nullable(),
  }).strict()).length(10),
  monthlyCalendar: monthlyCalendarSchema,
  timeCorrection: z.object({
    civilTime: z.string().min(1),
    trueSolarTime: z.string().min(1),
    engineCivilTime: z.string().min(1),
    zoneOffset: z.string().min(1),
    longitudeCorrectionMinutes: z.number(),
    equationOfTimeMinutes: z.number(),
  }).strict().nullable(),
  limitations: z.array(z.string()),
  uncertainty: z.object({
    precision: z.enum(["exact", "approximate", "unknown"]),
    candidateCount: z.number().int().positive(),
    rangeStart: z.string().min(1),
    rangeEnd: z.string().min(1),
    varyingFields: z.array(z.string()),
    candidateZoneOffsets: z.array(z.string()),
  }).strict(),
  interpretationCapabilities: z.record(z.string(), capabilitySchema),
  calculationFingerprint: z.string().min(1),
}).strict();

export type ManseryeokChart = z.infer<typeof manseryeokChartSchema>;
export type ManseryeokPosition = (typeof positions)[number];
export const MANSERYEOK_POSITIONS = positions;

export function parseManseryeokChart(value: unknown): ManseryeokChart | null {
  const parsed = manseryeokChartSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
