import { describe, expect, it } from "vitest";

import { containsDirectIdentifier } from "./direct-identifier";

describe("containsDirectIdentifier", () => {
  it.each([
    "reader@example.com",
    "010-1234-5678",
    "+82 10-1234-5678",
    "02-1234-5678",
    "1588-1234",
    "４１１１－１１１１－１１１１－１１１１",
    validResidentNumber("000101-312345"),
  ])("blocks a verifiable identifier in %s", (value) => {
    expect(containsDirectIdentifier(`제 정보는 ${value}입니다`)).toBe(true);
  });

  it.each([
    "우울증 진단을 받았는데 올해 흐름이 궁금해요",
    "저는 불교 신자입니다",
    "정당 가입을 고민하고 있어요",
    "죽고 싶다는 생각이 들어요",
    "성적 지향에 관해 고민하고 있어요",
    "4111 1111 1111 1112",
    "000101-3123450",
  ])("does not infer sensitive meaning or block an invalid checksum in %s", (value) => {
    expect(containsDirectIdentifier(value)).toBe(false);
  });
});

function validResidentNumber(firstTwelveDigits: string): string {
  const digits = firstTwelveDigits.replace("-", "");
  const weights = [2, 3, 4, 5, 6, 7, 8, 9, 2, 3, 4, 5];
  const sum = weights.reduce(
    (total, weight, index) => total + Number(digits[index]) * weight,
    0,
  );
  return `${firstTwelveDigits}${(11 - (sum % 11)) % 10}`;
}
