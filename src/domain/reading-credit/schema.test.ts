import { describe, expect, it } from "vitest";

import {
  getDisplayedReadingCredits,
  getReadingCreditAccess,
  parseReadingCreditPricing,
  parseReadingCreditStatus,
} from ".";

const status = {
  dailyFreeGrant: 10,
  balance: { free: 7, paid: 2, total: 9 },
  nextResetAt: "2026-08-22T00:00:00+09:00",
  generationInProgress: false,
  costs: {
    tarot: {
      mind_three_card: 2,
      relationship_three_card: 2,
      choice_five_card: 3,
    },
    saju: 4,
  },
};

describe("reading credit contract", () => {
  it("accepts the complete backend response", () => {
    expect(parseReadingCreditStatus(status)).toEqual(status);
  });

  it("rejects inconsistent balances and incomplete costs", () => {
    expect(() => parseReadingCreditStatus({
      ...status,
      balance: { free: 7, paid: 2, total: 10 },
    })).toThrow();
    expect(() => parseReadingCreditStatus({
      ...status,
      costs: { tarot: { mind_three_card: 2 }, saju: 4 },
    })).toThrow();
  });

  it("accepts the public price list and rejects anything beyond it", () => {
    const pricing = { dailyFreeGrant: 10, costs: status.costs };

    expect(parseReadingCreditPricing(pricing)).toEqual(pricing);
    expect(() => parseReadingCreditPricing({ ...pricing, balance: status.balance })).toThrow();
    expect(() => parseReadingCreditPricing({
      dailyFreeGrant: 10,
      costs: { tarot: { mind_three_card: 2 }, saju: 4 },
    })).toThrow();
  });

  it("prioritizes an active generation before balance checks", () => {
    expect(getReadingCreditAccess(
      { ...status, generationInProgress: true },
      false,
      4,
    )).toEqual({ status: "generation-in-progress" });
  });

  it("reports insufficient and allowed costs from total balance", () => {
    expect(getReadingCreditAccess(status, false, 10)).toMatchObject({
      status: "insufficient",
      required: 10,
      remaining: 9,
    });
    expect(getReadingCreditAccess(status, false, 3)).toEqual({
      status: "allowed",
      required: 3,
      remaining: 9,
    });
  });

  it("keeps the previous status visible while a refresh runs", () => {
    expect(getDisplayedReadingCredits({ status: "loading", data: status }))
      .toEqual({ data: status, loading: false });
    expect(getDisplayedReadingCredits({ status: "ready", data: status }))
      .toEqual({ data: status, loading: false });
  });

  it("reports loading only for the first load and drops data after an error", () => {
    expect(getDisplayedReadingCredits({ status: "loading", data: null }))
      .toEqual({ data: null, loading: true });
    expect(getDisplayedReadingCredits({ status: "error", data: status }))
      .toEqual({ data: null, loading: false });
    expect(getDisplayedReadingCredits({ status: "idle", data: null }))
      .toEqual({ data: null, loading: false });
  });
});
