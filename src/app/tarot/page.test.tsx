import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/tarot-experience", () => ({
  TarotExperience: ({ initialSpread }: { initialSpread?: string }) => (
    <p>initial spread: {initialSpread ?? "none"}</p>
  ),
}));

import TarotPage from "./page";

async function renderWithSpread(spread?: string | string[]) {
  render(await TarotPage({ searchParams: Promise.resolve(spread === undefined ? {} : { spread }) }));
}

describe("TarotPage", () => {
  it("preselects an AI spread from the login return path", async () => {
    await renderWithSpread("mind_three_card");

    expect(screen.getByText("initial spread: mind_three_card")).toBeInTheDocument();
  });

  it("uses the first value when the spread is repeated", async () => {
    await renderWithSpread(["relationship_three_card", "choice_five_card"]);

    expect(screen.getByText("initial spread: relationship_three_card")).toBeInTheDocument();
  });

  it.each([undefined, "daily_one_card", "toString", "unknown"])(
    "ignores %p",
    async (spread) => {
      await renderWithSpread(spread);

      expect(screen.getByText("initial spread: none")).toBeInTheDocument();
    },
  );
});
