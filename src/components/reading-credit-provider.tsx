"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import {
  parseReadingCreditPricing,
  parseReadingCreditStatus,
  type ReadingCreditPricing,
  type ReadingCreditStatus,
} from "@/domain/reading-credit";

type ReadingCreditState =
  | { status: "idle"; data: null }
  | { status: "loading"; data: ReadingCreditStatus | null }
  | { status: "ready"; data: ReadingCreditStatus }
  | { status: "error"; data: null };

interface RefreshOptions {
  // Set when the server just rejected a reading on credit grounds: the shown status is known to be
  // wrong, so it must not keep the start buttons enabled while the new one loads.
  discardCurrent?: boolean;
}

interface ReadingCreditContextValue {
  state: ReadingCreditState;
  refresh: (options?: RefreshOptions) => Promise<void>;
  // Guests only (a signed-in status already carries the costs): the public price list, loaded on
  // demand by the screens that show costs so other pages make no extra request.
  pricing: ReadingCreditPricing | null;
  requestPricing: () => void;
}

const ReadingCreditContext = createContext<ReadingCreditContextValue | null>(null);

export function ReadingCreditProvider({
  authenticated,
  children,
}: {
  authenticated: boolean;
  children: ReactNode;
}) {
  const [state, setState] = useState<ReadingCreditState>({ status: "idle", data: null });
  const [pricing, setPricing] = useState<ReadingCreditPricing | null>(null);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const pricingInFlight = useRef(false);
  const refreshedResetAt = useRef<string | null>(null);

  // Asked again each time a cost screen opens, so a long-lived tab follows a price change; the
  // previous list stays on screen meanwhile and only a request already running is shared.
  const requestPricing = useCallback(() => {
    if (authenticated || pricingInFlight.current) return;
    pricingInFlight.current = true;
    void (async () => {
      try {
        const response = await fetch("/api/reading-credits/pricing", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("credit pricing failed");
        setPricing(parseReadingCreditPricing(await response.json()));
      } catch {
        // Keep what is shown (unknown "…" on a first failure); the next screen that asks retries.
      } finally {
        pricingInFlight.current = false;
      }
    })();
  }, [authenticated]);

  const refresh = useCallback((options: RefreshOptions = {}): Promise<void> => {
    if (!authenticated) {
      setState({ status: "idle", data: null });
      return Promise.resolve();
    }
    if (options.discardCurrent) {
      setState({ status: "loading", data: null });
      // A refresh already running may have read the status before the rejection, so its answer
      // cannot be trusted either: wait for it, then read again, still showing no status.
      const earlier = refreshInFlight.current;
      if (earlier) return earlier.then(() => refresh({ discardCurrent: true }));
    }
    if (refreshInFlight.current) return refreshInFlight.current;

    const request = (async () => {
      setState((current) => ({ status: "loading", data: current.data }));
      try {
        const response = await fetch("/api/reading-credits", {
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!response.ok) throw new Error("credit status failed");
        setState({
          status: "ready",
          data: parseReadingCreditStatus(await response.json()),
        });
      } catch {
        setState({ status: "error", data: null });
      }
    })();
    refreshInFlight.current = request;
    void request.finally(() => {
      if (refreshInFlight.current === request) refreshInFlight.current = null;
    });
    return request;
  }, [authenticated]);

  const refreshAfterInFlight = useCallback(async (): Promise<void> => {
    const currentRequest = refreshInFlight.current;
    if (currentRequest) {
      await currentRequest;
      if (refreshInFlight.current === currentRequest) refreshInFlight.current = null;
    }
    await refresh();
  }, [refresh]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!authenticated) return;
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => document.removeEventListener("visibilitychange", refreshWhenVisible);
  }, [authenticated, refresh]);

  const nextResetAt = state.data?.nextResetAt ?? null;
  useEffect(() => {
    if (!authenticated || !nextResetAt || refreshedResetAt.current === nextResetAt) return;
    const resetTime = Date.parse(nextResetAt);
    if (!Number.isFinite(resetTime)) return;

    const timer = globalThis.setTimeout(() => {
      void refreshAfterInFlight().then(() => {
        refreshedResetAt.current = nextResetAt;
      });
    }, Math.max(resetTime - Date.now() + 100, 0));
    return () => globalThis.clearTimeout(timer);
  }, [authenticated, nextResetAt, refreshAfterInFlight]);

  const value = useMemo(
    () => ({ state, refresh, pricing, requestPricing }),
    [pricing, refresh, requestPricing, state],
  );
  return (
    <ReadingCreditContext.Provider value={value}>
      {children}
    </ReadingCreditContext.Provider>
  );
}

export function useReadingCredits(): ReadingCreditContextValue {
  const context = useContext(ReadingCreditContext);
  if (!context) throw new Error("ReadingCreditProvider is required");
  return context;
}
