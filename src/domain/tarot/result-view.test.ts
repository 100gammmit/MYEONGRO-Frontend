import { describe, expect, it } from "vitest";
import { MAJOR_ARCANA } from "./deck";
import { TAROT_SPREADS } from "./definitions";
import { parseTarotResultView } from "./result-view";

function completedReading() {
  const positions = TAROT_SPREADS.mind_three_card.positions;
  return {
    kind: "tarot", status: "completed", schemaVersion: 2, spreadType: "mind_three_card",
    input: { cards: positions.map((position, index) => ({
      position: position.id, cardId: MAJOR_ARCANA[index].id, reversed: false,
    })) },
    result: {
      readingMode: "standard", questionRedirected: false, title: "제목", summary: "요약",
      sections: positions.map((position) => ({ position: position.id, heading: "제목", body: "본문" })),
      disclaimer: "참고 안내",
    },
  };
}

describe("normal tarot result projection", () => {
  it("accepts new results and ignores obsolete or unknown fields in stored results", () => {
    const value = completedReading();
    expect(parseTarotResultView(value)).not.toBeNull();
    const parsed = parseTarotResultView({ ...value, result: {
      ...value.result, guidance: 123, unused: "old field",
    } });
    expect(parsed).not.toBeNull();
    expect(parsed?.result).not.toHaveProperty("guidance");
    expect(parsed?.result).not.toHaveProperty("unused");
    expect(parsed?.result.summary).toBe(value.result.summary);
  });

  it("still rejects missing required fields and declined/normal hybrids", () => {
    const value = completedReading();
    expect(parseTarotResultView({ ...value, result: { ...value.result, summary: undefined } })).toBeNull();
    expect(parseTarotResultView({ ...value, result: { ...value.result, resultType: "declined" } })).toBeNull();
  });
});
