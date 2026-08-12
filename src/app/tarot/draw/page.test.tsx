import { vi } from "vitest";

const redirect = vi.hoisted(() => vi.fn());

vi.mock("next/navigation", () => ({ redirect }));

import TarotDrawPage from "./page";

describe("TarotDrawPage", () => {
  it("redirects the legacy draw route because progress is memory-only", () => {
    TarotDrawPage();

    expect(redirect).toHaveBeenCalledWith("/tarot");
  });
});
