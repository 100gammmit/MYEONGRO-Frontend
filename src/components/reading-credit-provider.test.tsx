import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { ReadingCreditProvider, useReadingCredits } from "./reading-credit-provider";

const status = {
  dailyFreeGrant: 10,
  balance: { free: 7, paid: 2, total: 9 },
  nextResetAt: new Date(Date.now() + 60_000).toISOString(),
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

function Consumer() {
  const credits = useReadingCredits();
  return (
    <>
      <p>{credits.state.data?.balance.total ?? credits.state.status}</p>
      <button onClick={() => void credits.refresh()} type="button">refresh</button>
      <button onClick={() => void credits.refresh({ discardCurrent: true })} type="button">
        discard and refresh
      </button>
    </>
  );
}

describe("ReadingCreditProvider", () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("loads authenticated credit status without caching", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json(status));
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);

    expect(await screen.findByText("9")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith("/api/reading-credits", {
      credentials: "same-origin",
      cache: "no-store",
    });
  });

  it("does not query credits for guests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    render(<ReadingCreditProvider authenticated={false}><Consumer /></ReadingCreditProvider>);

    await waitFor(() => expect(screen.getByText("idle")).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("invalidates a previous balance when a later refresh fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(status))
      .mockResolvedValueOnce(new Response(null, { status: 503 }));
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);

    expect(await screen.findByText("9")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "refresh" }));

    expect(await screen.findByText("error")).toBeInTheDocument();
    expect(screen.queryByText("9")).not.toBeInTheDocument();
  });

  it("keeps the previous balance during a plain refresh but drops it when asked to discard", async () => {
    let resolveSecond: (response: Response) => void = () => {};
    let resolveThird: (response: Response) => void = () => {};
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(status))
      .mockReturnValueOnce(new Promise((resolve) => { resolveSecond = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveThird = resolve; }));
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);
    expect(await screen.findByText("9")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    expect(screen.getByText("9")).toBeInTheDocument();
    await act(async () => resolveSecond(Response.json(status)));

    fireEvent.click(screen.getByRole("button", { name: "discard and refresh" }));
    expect(screen.getByText("loading")).toBeInTheDocument();
    await act(async () => resolveThird(Response.json({
      ...status,
      balance: { free: 0, paid: 1, total: 1 },
    })));
    expect(await screen.findByText("1")).toBeInTheDocument();
  });

  it("does not trust a refresh that was already running when asked to discard", async () => {
    let resolveEarlier: (response: Response) => void = () => {};
    let resolveLater: (response: Response) => void = () => {};
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(status))
      .mockReturnValueOnce(new Promise((resolve) => { resolveEarlier = resolve; }))
      .mockReturnValueOnce(new Promise((resolve) => { resolveLater = resolve; }));
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);
    expect(await screen.findByText("9")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    fireEvent.click(screen.getByRole("button", { name: "discard and refresh" }));
    expect(screen.getByText("loading")).toBeInTheDocument();

    await act(async () => resolveEarlier(Response.json(status)));
    expect(screen.getByText("loading")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));

    await act(async () => resolveLater(Response.json({
      ...status,
      generationInProgress: true,
      balance: { free: 0, paid: 1, total: 1 },
    })));
    expect(await screen.findByText("1")).toBeInTheDocument();
  });

  it("refreshes credit status when the next reset time arrives", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-21T14:59:59Z"));
    const preResetStatus = {
      ...status,
      nextResetAt: "2026-08-22T00:00:00+09:00",
    };
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(preResetStatus))
      .mockResolvedValueOnce(Response.json({
        ...status,
        balance: { free: 10, paid: 2, total: 12 },
        nextResetAt: "2026-08-23T00:00:00+09:00",
      }));
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    expect(screen.getByText("9")).toBeInTheDocument();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_100);
    });

    expect(screen.getByText("12")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("starts a post-reset refresh after a pre-reset request finishes", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date("2026-08-21T14:59:59Z"));
    const preResetStatus = {
      ...status,
      nextResetAt: "2026-08-22T00:00:00+09:00",
    };
    let resolvePreResetRefresh: ((response: Response) => void) | undefined;
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(preResetStatus))
      .mockReturnValueOnce(new Promise((resolve) => {
        resolvePreResetRefresh = resolve;
      }))
      .mockResolvedValueOnce(Response.json({
        ...status,
        balance: { free: 10, paid: 2, total: 12 },
        nextResetAt: "2026-08-23T00:00:00+09:00",
      }));
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(0);
    });
    fireEvent.click(screen.getByRole("button", { name: "refresh" }));
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1_100);
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);

    await act(async () => {
      resolvePreResetRefresh?.(Response.json(preResetStatus));
      await vi.advanceTimersByTimeAsync(0);
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(await screen.findByText("12")).toBeInTheDocument();
  });

  it("refreshes credit status when a hidden tab becomes visible", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json(status))
      .mockResolvedValueOnce(Response.json({
        ...status,
        balance: { free: 10, paid: 2, total: 12 },
      }));
    const visibility = vi.spyOn(document, "visibilityState", "get")
      .mockReturnValue("visible");
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);

    expect(await screen.findByText("9")).toBeInTheDocument();
    visibility.mockReturnValue("hidden");
    fireEvent(document, new Event("visibilitychange"));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    visibility.mockReturnValue("visible");
    fireEvent(document, new Event("visibilitychange"));

    expect(await screen.findByText("12")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares an in-flight refresh when the tab becomes visible", async () => {
    let resolveResponse: ((response: Response) => void) | undefined;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise((resolve) => {
      resolveResponse = resolve;
    }));
    vi.spyOn(document, "visibilityState", "get").mockReturnValue("visible");
    render(<ReadingCreditProvider authenticated><Consumer /></ReadingCreditProvider>);

    fireEvent(document, new Event("visibilitychange"));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    resolveResponse?.(Response.json(status));
    expect(await screen.findByText("9")).toBeInTheDocument();
  });
});
