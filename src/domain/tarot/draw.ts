import { MAJOR_ARCANA } from "./deck";

const UINT32_RANGE = 0x1_0000_0000;

export interface DrawOptions {
  readonly randomUint32?: () => number;
}

export function drawCandidateCardIds(
  selectedCardIds: readonly string[],
  options: DrawOptions = {},
): string[] {
  const selected = new Set(selectedCardIds);
  const remaining = MAJOR_ARCANA
    .map((card) => card.id)
    .filter((cardId) => !selected.has(cardId));

  if (selected.size !== selectedCardIds.length) {
    throw new Error("선택 카드 ID는 중복될 수 없습니다.");
  }
  if (remaining.length < 5) {
    throw new Error("후보 카드 다섯 장을 편성할 수 없습니다.");
  }

  const randomUint32 = options.randomUint32 ?? cryptoRandomUint32;
  for (let index = 0; index < 5; index += 1) {
    const swapIndex = index + uniformRandomIndex(remaining.length - index, randomUint32);
    [remaining[index], remaining[swapIndex]] = [remaining[swapIndex], remaining[index]];
  }
  return remaining.slice(0, 5);
}

function cryptoRandomUint32(): number {
  const value = new Uint32Array(1);
  globalThis.crypto.getRandomValues(value);
  return value[0];
}

function uniformRandomIndex(upperExclusive: number, randomUint32: () => number): number {
  const rejectionLimit = Math.floor(UINT32_RANGE / upperExclusive) * upperExclusive;
  let value: number;
  do {
    value = randomUint32() >>> 0;
  } while (value >= rejectionLimit);
  return value % upperExclusive;
}
