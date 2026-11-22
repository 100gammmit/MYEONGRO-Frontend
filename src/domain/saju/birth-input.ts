import { birthDateProblem, birthDateProblemMessage } from "./birth-date";
import type {
  BirthTimePrecision,
  LuckDirectionBasis,
  SajuBirthPlacesResponse,
  SajuBirthProfile,
  SajuCalculationOptions,
  SajuDayBoundary,
} from "./contracts";

/**
 * The birth input shared by the AI saju wizard and the free manseryeok page.
 * Both send the same fields, so the same person gets the same chart in both.
 */
export interface SajuBirthValues {
  readonly birthDate: string;
  readonly birthTimePrecision: BirthTimePrecision | "";
  /** "00"–"23", or "" before one is chosen. */
  readonly birthHour: string;
  /** "00"–"59", or "" before one is chosen. Ignored unless the time is exact. */
  readonly birthMinute: string;
  readonly provinceCode: string;
  /** Optional; "" means the province's longitude is used. */
  readonly cityCode: string;
  readonly luckDirectionBasis: LuckDirectionBasis;
  readonly dayBoundary: SajuDayBoundary;
  readonly equationOfTime: boolean;
}

export type SajuBirthFieldKey =
  | "birthDate" | "birthTimePrecision" | "birthHour" | "birthMinute"
  | "provinceCode" | "cityCode" | "luckDirectionBasis" | "dayBoundary" | "equationOfTime";

export const EMPTY_BIRTH_VALUES: SajuBirthValues = {
  birthDate: "",
  birthTimePrecision: "",
  birthHour: "",
  birthMinute: "",
  provinceCode: "",
  cityCode: "",
  luckDirectionBasis: "unspecified",
  dayBoundary: "MIDNIGHT",
  equationOfTime: true,
};

export const DEFAULT_CALCULATION_OPTIONS = { dayBoundary: "MIDNIGHT", equationOfTime: true } as const;

/** Backend request field → the input that should show its error. */
export const BIRTH_FIELD_BY_REQUEST_PATH: Readonly<Record<string, SajuBirthFieldKey>> = {
  "birthProfile.birthDate": "birthDate",
  "birthProfile.birthTimePrecision": "birthTimePrecision",
  "birthProfile.birthTime": "birthHour",
  "birthProfile.provinceCode": "provinceCode",
  "birthProfile.cityCode": "cityCode",
  "birthProfile.luckDirectionBasis": "luckDirectionBasis",
  options: "dayBoundary",
  "options.dayBoundary": "dayBoundary",
  "options.equationOfTime": "equationOfTime",
  calculationOptions: "dayBoundary",
  "calculationOptions.dayBoundary": "dayBoundary",
  "calculationOptions.equationOfTime": "equationOfTime",
};

export function isBirthTimeKnown(precision: SajuBirthValues["birthTimePrecision"]): boolean {
  return precision === "exact" || precision === "approximate";
}

/** Approximate times are sent on the hour: the backend then looks 60 minutes either side of it. */
export function birthTimeOf(values: SajuBirthValues): string | undefined {
  if (!isBirthTimeKnown(values.birthTimePrecision) || !values.birthHour) return undefined;
  if (values.birthTimePrecision === "approximate") return `${values.birthHour}:00`;
  return values.birthMinute ? `${values.birthHour}:${values.birthMinute}` : undefined;
}

export function findMissingBirthFields(values: SajuBirthValues): Partial<Record<SajuBirthFieldKey, string>> {
  const missing: Partial<Record<SajuBirthFieldKey, string>> = {};
  if (!values.birthDate) {
    missing.birthDate = "양력 생년월일을 입력해 주세요.";
  } else {
    const problem = birthDateProblem(values.birthDate);
    if (problem) missing.birthDate = birthDateProblemMessage(values.birthDate, problem);
  }
  if (!values.birthTimePrecision) {
    missing.birthTimePrecision = "출생 시각의 정확도를 골라 주세요.";
  } else if (isBirthTimeKnown(values.birthTimePrecision)) {
    if (!values.birthHour) missing.birthHour = "태어난 시를 골라 주세요.";
    else if (values.birthTimePrecision === "exact" && !values.birthMinute) missing.birthMinute = "태어난 분을 골라 주세요.";
    if (!values.provinceCode) missing.provinceCode = "출생 시·도를 골라 주세요.";
  }
  return missing;
}

/** The birth profile as both backends accept it; time and place are left out when the time is unknown. */
export function birthProfileOf(values: SajuBirthValues): SajuBirthProfile {
  const time = birthTimeOf(values);
  const known = isBirthTimeKnown(values.birthTimePrecision);
  return {
    calendarType: "solar",
    birthDate: values.birthDate,
    birthTimePrecision: values.birthTimePrecision as BirthTimePrecision,
    ...(known && time ? { birthTime: time } : {}),
    ...(known ? { provinceCode: values.provinceCode } : {}),
    ...(known && values.cityCode ? { cityCode: values.cityCode } : {}),
    luckDirectionBasis: values.luckDirectionBasis,
  };
}

/** Only the options that differ from the defaults; undefined when both are default. */
export function calculationOptionsOf(values: SajuBirthValues): SajuCalculationOptions | undefined {
  const options: { dayBoundary?: SajuDayBoundary; equationOfTime?: boolean } = {};
  if (values.dayBoundary !== DEFAULT_CALCULATION_OPTIONS.dayBoundary) options.dayBoundary = values.dayBoundary;
  if (values.equationOfTime !== DEFAULT_CALCULATION_OPTIONS.equationOfTime) options.equationOfTime = values.equationOfTime;
  return Object.keys(options).length ? options : undefined;
}

/** Picking another province drops a city that belonged to the old one. */
export function withProvince(values: SajuBirthValues, provinceCode: string): SajuBirthValues {
  return { ...values, provinceCode, cityCode: values.cityCode.startsWith(provinceCode) && provinceCode ? values.cityCode : "" };
}

export function calculationOptionsSummary(values: Pick<SajuBirthValues, "dayBoundary" | "equationOfTime">): string {
  return `${values.dayBoundary === "HOUR_23" ? "23시 기준" : "자정 기준"} · 균시차 ${values.equationOfTime ? "적용" : "제외"}`;
}

export function birthPlaceName(catalog: SajuBirthPlacesResponse | null, values: Pick<SajuBirthValues, "provinceCode" | "cityCode">): string {
  const province = catalog?.provinces.find((item) => item.provinceCode === values.provinceCode);
  if (!province) return "";
  const city = province.cities?.find((item) => item.cityCode === values.cityCode);
  return city ? `${province.provinceName} ${city.cityName}` : province.provinceName;
}

/** "1992-08-17" → "1992년 8월 17일". */
export function formatBirthDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? `${year}년 ${month}월 ${day}일` : value;
}

export function birthTimeSummary(values: SajuBirthValues): string {
  if (values.birthTimePrecision === "unknown") return "모름 · 시주 제외";
  if (values.birthTimePrecision === "approximate") return `${Number(values.birthHour)}시쯤 · 앞뒤 60분`;
  return `${values.birthHour}:${values.birthMinute} · 정확한 시각`;
}

export function luckBasisSummary(value: LuckDirectionBasis): string {
  if (value === "male") return "남성";
  if (value === "female") return "여성";
  return "선택하지 않음 · 대운 제외";
}

