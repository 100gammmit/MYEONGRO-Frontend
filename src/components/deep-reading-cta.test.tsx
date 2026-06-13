import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push }),
}));

import { DeepReadingCta } from "./deep-reading-cta";

describe("DeepReadingCta", () => {
  it("shows a disabled preparation state without opening checkout", () => {
    render(<DeepReadingCta kind="tarot" />);
    expect(screen.getByRole("button", { name: "심층 리딩 준비 중" })).toBeDisabled();
    expect(push).not.toHaveBeenCalled();
  });
});
