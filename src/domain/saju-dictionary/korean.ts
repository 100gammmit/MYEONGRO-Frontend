export { withAnd } from "@/domain/zodiac-fortune/korean";

function hasFinalConsonant(word: string): boolean {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 !== 0;
}

/** "은" after a final consonant, "는" after a vowel, e.g. 상관 → 은, 겁재 → 는. */
export function topic(word: string): string {
  return hasFinalConsonant(word) ? "은" : "는";
}

/** "이에요" after a final consonant, "예요" after a vowel, e.g. 식신이에요, 겁재예요. */
export function isPolite(word: string): string {
  return hasFinalConsonant(word) ? "이에요" : "예요";
}

/** "이" after a final consonant, "가" after a vowel, e.g. 목이, 화가. */
export function subject(word: string): string {
  return hasFinalConsonant(word) ? "이" : "가";
}

/** "을" after a final consonant, "를" after a vowel, e.g. 목을, 화를. */
export function object(word: string): string {
  return hasFinalConsonant(word) ? "을" : "를";
}

/** "이라도" after a final consonant, "라도" after a vowel. */
export function evenIf(word: string): string {
  return hasFinalConsonant(word) ? "이라도" : "라도";
}
