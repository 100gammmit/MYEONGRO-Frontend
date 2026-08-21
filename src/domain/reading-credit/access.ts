import type { ReadingCreditAccess, ReadingCreditStatus } from "./contracts";

export function getReadingCreditAccess(
  status: ReadingCreditStatus | null,
  loading: boolean,
  required: number | null,
): ReadingCreditAccess {
  if (loading) return { status: "loading" };
  if (!status) return { status: "unavailable" };
  if (required === null) return { status: "loading" };
  if (status.generationInProgress) return { status: "generation-in-progress" };
  if (status.balance.total < required) {
    return {
      status: "insufficient",
      required,
      remaining: status.balance.total,
      nextResetAt: status.nextResetAt,
    };
  }
  return { status: "allowed", required, remaining: status.balance.total };
}
