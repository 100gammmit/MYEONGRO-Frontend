import { z } from "zod";
import { readingModeSchema } from "@/domain/reading/reading-mode";

const textSchema = z.string().trim().min(1);
const focusAreaSchema = z.enum(["self", "career", "relationship", "life_money"]);
const evidenceKeySchema = z.enum([
  "pillars",
  "dayMaster",
  "elementBalance",
  "tenGods",
  "interactions",
  "currentLuckCycle",
  "annualFlow",
  "limitations",
  "uncertainty",
]);

const birthProfileCommon = {
  calendarType: z.literal("solar"),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  luckDirectionBasis: z.enum(["male", "female", "unspecified"]),
} as const;

const legacyBirthProfileSchema = z.object({
  ...birthProfileCommon,
  birthTimePrecision: z.enum(["exact", "approximate", "unknown"]),
  birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  provinceCode: z.string().regex(/^\d{2}$/),
  cityCode: z.string().regex(/^\d{5}$/),
}).strict().superRefine((profile, context) => {
  const requiresTime = profile.birthTimePrecision !== "unknown";
  if (requiresTime !== (profile.birthTime !== undefined)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthTime"],
      message: "Birth time must match its precision.",
    });
  }
  if (!profile.cityCode.startsWith(profile.provinceCode)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cityCode"],
      message: "Legacy birth place codes do not belong to the same region.",
    });
  }
});

const currentBirthProfileSchema = z.discriminatedUnion("birthTimePrecision", [
  z.object({
    ...birthProfileCommon,
    birthTimePrecision: z.literal("exact"),
    birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    provinceCode: z.string().regex(/^\d{2}$/),
  }).strict(),
  z.object({
    ...birthProfileCommon,
    birthTimePrecision: z.literal("approximate"),
    birthTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    provinceCode: z.string().regex(/^\d{2}$/),
  }).strict(),
  z.object({
    ...birthProfileCommon,
    birthTimePrecision: z.literal("unknown"),
  }).strict(),
]);

const pillarSchema = z.object({
  ganZhi: textSchema,
  stem: textSchema.nullable(),
  branch: textSchema.nullable(),
  fiveElements: textSchema.nullable(),
  stemTenGod: textSchema.nullable(),
  branchTenGods: z.array(textSchema),
}).strict();

const pillarsSchema = z.object({
  year: pillarSchema.nullable(),
  month: pillarSchema.nullable(),
  day: pillarSchema.nullable(),
  time: pillarSchema.nullable(),
}).strict();

const luckCycleSchema = z.object({
  direction: textSchema,
  startDate: textSchema,
  startAgeYears: z.number().int().nonnegative(),
  startAgeMonths: z.number().int().nonnegative(),
  periods: z.array(z.object({
    startYear: z.number().int(),
    endYear: z.number().int(),
    startAge: z.number().int(),
    endAge: z.number().int(),
    ganZhi: textSchema,
  }).strict()),
}).strict();

const calculationSnapshotSchema = z.object({
  calculationVersion: textSchema,
  engine: textSchema,
  engineVersion: textSchema,
  cityCatalogVersion: textSchema,
  targetYear: z.number().int(),
  timeCorrection: z.object({
    civilTime: textSchema,
    trueSolarTime: textSchema,
    engineCivilTime: textSchema,
    zoneOffset: textSchema,
    longitudeCorrectionMinutes: z.number(),
    equationOfTimeMinutes: z.number(),
  }).strict().nullable(),
  pillars: pillarsSchema,
  dayMaster: textSchema.nullable(),
  fiveElements: z.record(z.string(), z.number().int().nonnegative()),
  relations: z.array(z.object({
    type: textSchema,
    members: z.array(textSchema).min(1),
  }).strict()),
  luckCycle: luckCycleSchema.nullable(),
  annualFortune: z.object({
    year: z.number().int(),
    ganZhi: textSchema,
    stemTenGod: textSchema,
  }).strict().nullable(),
  limitations: z.array(textSchema),
  uncertainty: z.object({
    precision: z.enum(["exact", "approximate", "unknown"]),
    candidateCount: z.number().int().positive(),
    rangeStart: textSchema,
    rangeEnd: textSchema,
    varyingFields: z.array(textSchema),
    candidateZoneOffsets: z.array(textSchema),
  }).strict(),
}).strict();

const evidenceKeysSchema = z.array(evidenceKeySchema).min(1).superRefine((keys, context) => {
  if (new Set(keys).size !== keys.length) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: "근거 키가 중복되었습니다." });
  }
});

const sectionSchema = z.object({
  id: z.enum(["core", "strengths", "relationship", "work"]),
  heading: textSchema,
  body: textSchema,
  evidenceKeys: evidenceKeysSchema,
}).strict();

const resultSchema = z.object({
  readingMode: readingModeSchema.default("standard"),
  title: textSchema,
  summary: textSchema,
  natalSections: z.array(sectionSchema).length(4),
  annualReading: z.object({
    year: z.number().int(),
    heading: textSchema,
    body: textSchema,
    evidenceKeys: evidenceKeysSchema,
  }).strict(),
  questionReading: z.object({
    focusArea: focusAreaSchema,
    heading: textSchema,
    body: textSchema,
    evidenceKeys: evidenceKeysSchema,
  }).strict(),
  guidance: z.array(textSchema).min(1).max(2),
  disclaimer: textSchema,
}).strict();

const completedRecordCommon = {
  id: textSchema,
  kind: z.literal("saju"),
  status: z.literal("completed"),
  result: resultSchema,
} as const;

const completedInputCommon = {
  question: textSchema,
  focusArea: focusAreaSchema,
  targetYear: z.number().int(),
  calculationSnapshot: calculationSnapshotSchema,
} as const;

const completedSajuRecordSchema = z.union([
  z.object({
    ...completedRecordCommon,
    schemaVersion: z.literal(2),
    input: z.object({
      ...completedInputCommon,
      birthProfile: legacyBirthProfileSchema,
    }).strict(),
  }).passthrough(),
  z.object({
    ...completedRecordCommon,
    schemaVersion: z.literal(3),
    input: z.object({
      ...completedInputCommon,
      birthProfile: currentBirthProfileSchema,
    }).strict(),
  }).passthrough(),
]).superRefine((reading, context) => {
  const snapshot = reading.input.calculationSnapshot;
  const expectedSections = ["core", "strengths", "relationship", "work"];
  if (reading.result.natalSections.some((section, index) => section.id !== expectedSections[index])) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["result", "natalSections"],
      message: "사주 섹션 순서가 올바르지 않습니다.",
    });
  }
  if (reading.result.annualReading.year !== reading.input.targetYear
    || reading.input.calculationSnapshot.targetYear !== reading.input.targetYear) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["result", "annualReading", "year"],
      message: "사주 기준 연도가 일치하지 않습니다.",
    });
  }
  if (reading.result.questionReading.focusArea !== reading.input.focusArea) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["result", "questionReading", "focusArea"],
      message: "사주 관심 분야가 일치하지 않습니다.",
    });
  }
  if (snapshot.dayMaster === null || snapshot.annualFortune === null) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["input", "calculationSnapshot"],
      message: "A completed Saju reading requires a day master and annual fortune.",
    });
  }
  if (snapshot.annualFortune !== null
    && snapshot.annualFortune.year !== reading.input.targetYear) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["input", "calculationSnapshot", "annualFortune", "year"],
      message: "Annual fortune year does not match the requested year.",
    });
  }
  const evidenceKeys = [
    ...reading.result.natalSections.flatMap((section) => section.evidenceKeys),
    ...reading.result.annualReading.evidenceKeys,
    ...reading.result.questionReading.evidenceKeys,
  ];
  if (snapshot.luckCycle === null && evidenceKeys.includes("currentLuckCycle")) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["result"],
      message: "없는 대운을 근거로 사용할 수 없습니다.",
    });
  }
});

export type SajuReadingView = z.infer<typeof completedSajuRecordSchema>;
export type SajuCalculationSnapshot = z.infer<typeof calculationSnapshotSchema>;
export type SajuEvidenceKey = z.infer<typeof evidenceKeySchema>;
export type SajuBirthProfile = z.infer<typeof legacyBirthProfileSchema>
  | z.infer<typeof currentBirthProfileSchema>;

export function parseSajuReadingView(value: unknown): SajuReadingView | null {
  const parsed = completedSajuRecordSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
