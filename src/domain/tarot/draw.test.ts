import { describe, expect, it } from "vitest";

import { MAJOR_ARCANA } from "./deck";
import { drawCandidateCardIds } from "./draw";

function sequenceRandom(values: number[]) {
  let index = 0;
  return () => values[index++ % values.length] ?? 0;
}

describe("drawCandidateCardIds", () => {
  it.each([
    [[], 22],
    [["major-00-fool"], 21],
    [["major-00-fool", "major-01-magician"], 20],
    [["major-00-fool", "major-01-magician", "major-02-high-priestess"], 19],
    [["major-00-fool", "major-01-magician", "major-02-high-priestess", "major-03-empress"], 18],
  ])("draws five unique candidates from a remaining population of %i", (selectedCardIds, population) => {
    const candidates = drawCandidateCardIds(selectedCardIds, {
      randomUint32: sequenceRandom([0, 1, 2, 3, 4]),
    });

    expect(MAJOR_ARCANA.length - selectedCardIds.length).toBe(population);
    expect(candidates).toHaveLength(5);
    expect(new Set(candidates).size).toBe(5);
    expect(candidates.every((cardId) => !selectedCardIds.includes(cardId))).toBe(true);
    expect(candidates.every((cardId) => MAJOR_ARCANA.some((card) => card.id === cardId))).toBe(true);
  });

  it("allows unselected candidates to return in a later round", () => {
    const first = drawCandidateCardIds([], { randomUint32: () => 0 });
    const selected = first[0];
    const second = drawCandidateCardIds([selected], { randomUint32: () => 0 });

    expect(second).not.toContain(selected);
    expect(second.some((cardId) => first.slice(1).includes(cardId))).toBe(true);
  });
});
