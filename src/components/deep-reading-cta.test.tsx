import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { DeepReadingCta } from "./deep-reading-cta";

describe("DeepReadingCta", () => {
  it("moves a tarot user into the checkout journey", () => {
    render(<DeepReadingCta kind="tarot" />);
    fireEvent.click(screen.getByRole("button", { name: "심층 리딩 열기" }));
    expect(push).toHaveBeenCalledWith("/checkout?kind=tarot");
  });
});
