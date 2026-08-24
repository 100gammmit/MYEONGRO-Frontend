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
  parseReadingCreditStatus,
  type ReadingCreditStatus,
} from "@/domain/reading-credit";

type ReadingCreditState =
  | { status: "idle"; data: null }
  | { status: "loading"; data: ReadingCreditStatus | null }
  | { status: "ready"; data: ReadingCreditStatus }
  | { status: "error"; data: null };

interface ReadingCreditContextValue {
  state: ReadingCreditState;
  refresh: () => Promise<void>;
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
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const refreshedResetAt = useRef<string | null>(null);

  const refresh = useCallback((): Promise<void> => {
    if (!authenticated) {
      setState({ status: "idle", data: null });
      return Promise.resolve();
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

  const value = useMemo(() => ({ state, refresh }), [refresh, state]);
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
