import { describe, expect, it } from "vitest";

import { TAROT_SPREADS, type TarotSpreadType } from "./definitions";

describe("TAROT_SPREADS", () => {
  it("mirrors the four frozen spread ids, card counts, and position order", () => {
    const contract: Record<TarotSpreadType, readonly string[]> = {
      daily_one_card: ["today"],
      mind_three_card: ["emotion", "underlying_need", "self_action"],
      relationship_three_card: ["my_heart", "relationship_flow", "check_point"],
      choice_five_card: ["desire", "fear", "core_value", "option_a", "option_b"],
    };

    expect(Object.keys(TAROT_SPREADS)).toEqual(Object.keys(contract));
    for (const spreadType of Object.keys(contract) as TarotSpreadType[]) {
      const definition = TAROT_SPREADS[spreadType];
      expect(definition.id).toBe(spreadType);
      expect(definition.cardCount).toBe(contract[spreadType].length);
      expect(definition.positions.map((position) => position.id)).toEqual(contract[spreadType]);
      expect(definition.positions.every((position) => position.instruction.length > 0)).toBe(true);
    }
  });
});
