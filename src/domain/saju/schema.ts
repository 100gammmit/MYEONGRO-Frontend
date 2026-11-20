import { z } from "zod";

import type {
  SajuBirthPlacesResponse,
  SajuReadingCreatedResponse,
  SajuReadingCreateRequest,
} from "./contracts";

const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

const citySchema = z.object({
  cityCode: z.string().regex(/^\d{5}$/),
  cityName: z.string().min(1),
}).strict();

const provinceSchema = z.object({
  provinceCode: z.string().regex(/^\d{2}$/),
  provinceName: z.string().min(1),
  // Sent by the backend once AI readings accept a city; optional until then.
  cities: z.array(citySchema).optional(),
}).strict();

const birthPlacesSchema = z.object({
  version: z.string().min(1),
  provinces: z.array(provinceSchema).min(1),
}).strict();

const birthProfileSchema = z.object({
  calendarType: z.literal("solar"),
  birthDate: dateSchema,
  birthTimePrecision: z.enum(["exact", "approximate", "unknown"]),
  birthTime: timeSchema.optional(),
  provinceCode: z.string().regex(/^\d{2}$/).optional(),
  cityCode: z.string().regex(/^\d{5}$/).optional(),
  luckDirectionBasis: z.enum(["male", "female", "unspecified"]),
}).strict().superRefine((profile, context) => {
  if (profile.cityCode !== undefined && (profile.birthTimePrecision === "unknown" || !profile.provinceCode || !profile.cityCode.startsWith(profile.provinceCode))) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cityCode"],
      message: "시·군·구는 출생 시각과 그 시·도가 있을 때만 보냅니다.",
    });
  }
  if (profile.birthTimePrecision === "unknown" && profile.birthTime !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthTime"],
      message: "시간 미상에는 출생 시각을 보내지 않습니다.",
    });
  }
  if (profile.birthTimePrecision !== "unknown" && profile.birthTime === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["birthTime"],
      message: "출생 시각이 필요합니다.",
    });
  }
  if (profile.birthTimePrecision === "unknown" && profile.provinceCode !== undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["provinceCode"],
      message: "시간 미상에는 출생지를 보내지 않습니다.",
    });
  }
  if (profile.birthTimePrecision !== "unknown" && profile.provinceCode === undefined) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["provinceCode"],
      message: "출생 시·도가 필요합니다.",
    });
  }
});

const readingCreateRequestSchema = z.object({
  reportType: z.enum(["birth_annual_question", "annual_monthly"]).optional(),
  targetYear: z.number().int().min(1900).max(2100).optional(),
  requestId: z.string().uuid(),
  question: z.string().trim().max(300).optional(),
  focusArea: z.enum(["self", "career", "relationship", "life_money"]),
  birthProfile: birthProfileSchema,
  calculationOptions: z.object({
    dayBoundary: z.enum(["MIDNIGHT", "HOUR_23"]).optional(),
    equationOfTime: z.boolean().optional(),
  }).strict().optional(),
}).strict().superRefine((request, context) => {
  if (request.reportType !== "annual_monthly" && !request.question) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["question"], message: "질문을 입력해 주세요." });
  }
});

const readingCreatedResponseSchema = z.object({
  reading: z.object({
    id: z.string().min(1),
    kind: z.literal("saju"),
    schemaVersion: z.union([z.literal(5), z.literal(6), z.literal(7)]),
    status: z.enum(["generating", "completed", "failed"]),
  }).passthrough(),
}).strict();

export function parseSajuBirthPlaces(input: unknown): SajuBirthPlacesResponse {
  return birthPlacesSchema.parse(input);
}

export function parseSajuReadingCreateRequest(input: unknown): SajuReadingCreateRequest {
  return readingCreateRequestSchema.parse(input);
}

export function parseSajuReadingCreatedResponse(input: unknown): SajuReadingCreatedResponse {
  return readingCreatedResponseSchema.parse(input);
}
