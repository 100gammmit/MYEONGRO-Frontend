import type { AiTarotSpreadType } from "@/domain/tarot";

export interface ReadingCreditStatus {
  dailyFreeGrant: number;
  balance: {
    free: number;
    paid: number;
    total: number;
  };
  nextResetAt: string;
  generationInProgress: boolean;
  costs: {
    tarot: Record<AiTarotSpreadType, number>;
    saju: number;
  };
}

// The public price list (GET /api/reading-credits/pricing): what a guest can see before logging in.
export interface ReadingCreditPricing {
  dailyFreeGrant: number;
  costs: ReadingCreditStatus["costs"];
}

export type ReadingCreditAccess =
  | { status: "loading" }
  | { status: "unavailable" }
  | { status: "generation-in-progress" }
  | { status: "insufficient"; required: number; remaining: number; nextResetAt: string }
  | { status: "allowed"; required: number; remaining: number };
