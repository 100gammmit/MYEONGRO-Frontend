import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";

import { ReadingCreditProvider, useReadingCredits } from "./reading-credit-provider";

const status = {
  dailyFreeGrant: 10,
  balance: { free: 7, paid: 2, total: 9 },
  nextResetAt: "2026-08-22T00:00:00+09:00",
  generationInProgress: false,
  costs: {
    tarot: {
      daily_one_card: 1,
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
    </>
  );
}

describe("ReadingCreditProvider", () => {
  afterEach(() => vi.restoreAllMocks());

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
});
