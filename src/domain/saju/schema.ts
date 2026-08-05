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
  cities: z.array(citySchema).min(1),
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
  provinceCode: z.string().regex(/^\d{2}$/),
  cityCode: z.string().regex(/^\d{5}$/),
  luckDirectionBasis: z.enum(["male", "female", "unspecified"]),
}).strict().superRefine((profile, context) => {
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
  if (!profile.cityCode.startsWith(profile.provinceCode)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["cityCode"],
      message: "시·도와 시·군·구가 일치하지 않습니다.",
    });
  }
});

const readingCreateRequestSchema = z.object({
  kind: z.literal("saju"),
  requestId: z.string().uuid(),
  question: z.string().trim().min(1).max(300),
  focusArea: z.enum(["self", "career", "relationship", "life_money"]),
  birthProfile: birthProfileSchema,
}).strict();

const readingCreatedResponseSchema = z.object({
  reading: z.object({
    id: z.string().min(1),
    kind: z.literal("saju"),
    schemaVersion: z.literal(2),
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
