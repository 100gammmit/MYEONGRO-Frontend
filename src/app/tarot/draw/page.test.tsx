import { render } from "@testing-library/react";
import { vi } from "vitest";

const tarotExperience = vi.hoisted(() => vi.fn(() => <div>draw experience</div>));

vi.mock("@/components/tarot-experience", () => ({
  TarotExperience: tarotExperience,
}));

import TarotDrawPage from "./page";

describe("TarotDrawPage", () => {
  it("renders the tarot experience in draw-route mode", () => {
    render(<TarotDrawPage />);

    expect(tarotExperience).toHaveBeenCalledWith(
      { route: "draw" },
      undefined,
    );
  });
});
