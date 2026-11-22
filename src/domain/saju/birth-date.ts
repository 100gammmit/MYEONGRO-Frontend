/**
 * The birth date field takes eight digits and shows them as YYYY-MM-DD while typing. The stored value
 * is the formatted text, so a complete entry is already the backend's ISO date.
 */

export const MIN_BIRTH_DATE = "1900-01-01";

const WEEKDAYS = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"] as const;

/** Digits only, the first eight, grouped 4·2·2 with hyphens: "19920817" and "1992.08.17" → "1992-08-17". */
export function formatBirthDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

export function countDigits(value: string): number {
  return value.replace(/\D/g, "").length;
}

/** Today's date in Korea as YYYY-MM-DD, the last day a birth date may fall on. */
export function seoulToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "Asia/Seoul" }).format(now);
}

export type BirthDateProblem = "incomplete" | "invalid" | "outOfRange";

function parts(value: string): [number, number, number] | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? [Number(match[1]), Number(match[2]), Number(match[3])] : null;
}

function isRealDate(year: number, month: number, day: number): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

/** Why a typed birth date cannot be calculated yet, or null when it can. An empty field is the caller's case. */
export function birthDateProblem(value: string, today = seoulToday()): BirthDateProblem | null {
  const date = parts(value);
  if (!date) return "incomplete";
  if (!isRealDate(...date)) return "invalid";
  // ISO dates compare correctly as text.
  if (value < MIN_BIRTH_DATE || value > today) return "outOfRange";
  return null;
}

/** The message shown under the field for each problem. */
export function birthDateProblemMessage(value: string, problem: BirthDateProblem): string {
  if (problem === "incomplete") return "숫자 8자리로 입력해 주세요 (예: 1992-08-17)";
  if (problem === "outOfRange") return "1900년부터 오늘까지의 날짜만 계산할 수 있어요.";
  const [, month, day] = parts(value) ?? [0, 0, 0];
  return `${month}월 ${day}일은 없는 날짜예요.`;
}

/** "1992년 8월 17일 월요일 · 양력" for a complete, real date; null otherwise. */
export function birthDateConfirmation(value: string): string | null {
  const date = parts(value);
  if (!date || !isRealDate(...date)) return null;
  const [year, month, day] = date;
  return `${year}년 ${month}월 ${day}일 ${WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]} · 양력`;
}
