import type { ReadingCreditAccess, ReadingCreditStatus } from "./contracts";

export interface DisplayedReadingCredits {
  data: ReadingCreditStatus | null;
  // True only for the first load; a refresh keeps showing the previous status instead.
  loading: boolean;
}

// A refresh (tab focus, reset time, after a reading) keeps the previous status on screen until the
// new one arrives so the balance and costs do not blink. An error drops it: a stale balance must
// not stay usable once the server could not confirm it.
export function getDisplayedReadingCredits(state: {
  status: "idle" | "loading" | "ready" | "error";
  data: ReadingCreditStatus | null;
}): DisplayedReadingCredits {
  const data = state.status === "ready" || state.status === "loading" ? state.data : null;
  return { data, loading: state.status === "loading" && data === null };
}

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
