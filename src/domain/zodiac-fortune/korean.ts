/** "와" after a vowel, "과" after a final consonant, e.g. 양 → 과, 소 → 와. */
export function withAnd(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 !== 0 ? "과" : "와";
}
