"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  | { status: "error"; data: ReadingCreditStatus | null };

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

  const refresh = useCallback(async () => {
    if (!authenticated) {
      setState({ status: "idle", data: null });
      return;
    }
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
      setState((current) => ({ status: "error", data: current.data }));
    }
  }, [authenticated]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
