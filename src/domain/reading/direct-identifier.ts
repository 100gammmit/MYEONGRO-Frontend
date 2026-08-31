export const DIRECT_IDENTIFIER_INPUT_MESSAGE =
  "이메일·전화번호·주민등록번호·카드번호처럼 형식이 확인되는 개인정보는 입력할 수 없어요. 해당 정보를 지우고 다시 시도해 주세요.";

const EMAIL_PATTERN = /[\p{L}\p{N}._%+\-]+@[\p{L}\p{N}.\-]+\.[\p{L}]{2,}/iu;
const PHONE_PATTERN = new RegExp([
  String.raw`(?<!\d)(?:(?:\+82|0082)[- .]?(?:10|1[016789])|01[016789])[- .]?\d{3,4}[- .]?\d{4}(?!\d)`,
  String.raw`(?<!\d)0(?:2|3[1-3]|4[1-4]|5[1-5]|6[1-4]|70)[- .]?\d{3,4}[- .]?\d{4}(?!\d)`,
  String.raw`(?<!\d)(?:15|16|18)\d{2}[- .]?\d{4}(?!\d)`,
].join("|"), "u");
const RESIDENT_NUMBER_PATTERN = /(?:^|\D)(\d{6})[- ]?([1-4]\d{6})(?!\d)/gu;
const CARD_NUMBER_PATTERN = /(?:^|\D)((?:\d[ -]?){12,18}\d)(?!\d)/gu;
const RESIDENT_NUMBER_WEIGHTS = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5] as const;

export function containsDirectIdentifier(value: string): boolean {
  const normalized = value.normalize("NFKC");
  return EMAIL_PATTERN.test(normalized)
    || PHONE_PATTERN.test(normalized)
    || containsValidResidentNumber(normalized)
    || containsLuhnCardNumber(normalized);
}

function containsValidResidentNumber(value: string): boolean {
  for (const match of value.matchAll(RESIDENT_NUMBER_PATTERN)) {
    const digits = `${match[1]}${match[2]}`;
    if (hasValidResidentBirthDate(digits) && hasValidResidentChecksum(digits)) return true;
  }
  return false;
}

function hasValidResidentBirthDate(digits: string): boolean {
  const century = digits[6] === "1" || digits[6] === "2" ? 1900 : 2000;
  const year = century + Number(digits.slice(0, 2));
  const month = Number(digits.slice(2, 4));
  const day = Number(digits.slice(4, 6));
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

function hasValidResidentChecksum(digits: string): boolean {
  const sum = RESIDENT_NUMBER_WEIGHTS.reduce(
    (total, weight, index) => total + Number(digits[index]) * weight,
    0,
  );
  return (11 - (sum % 11)) % 10 === Number(digits[12]);
}

function containsLuhnCardNumber(value: string): boolean {
  for (const match of value.matchAll(CARD_NUMBER_PATTERN)) {
    const digits = match[1].replace(/[^\d]/g, "");
    if (digits.length >= 13 && digits.length <= 19 && passesLuhn(digits)) return true;
  }
  return false;
}

function passesLuhn(digits: string): boolean {
  let sum = 0;
  let doubleDigit = false;
  for (let index = digits.length - 1; index >= 0; index -= 1) {
    let digit = Number(digits[index]);
    if (doubleDigit) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    doubleDigit = !doubleDigit;
  }
  return sum % 10 === 0;
}
