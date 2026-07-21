import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("offers tarot and saju as the two primary journeys", () => {
    render(<HomePage />);

    expect(screen.getByRole("link", { name: /타로 리딩 시작/i })).toHaveAttribute(
      "href",
      "/tarot",
    );
    expect(screen.getByRole("link", { name: /사주 리딩 시작/i })).toHaveAttribute(
      "href",
      "/saju",
    );
    expect(
      screen.getByRole("heading", { name: /지금의 나를\s*조금 더 이해하는 시간/i }),
    ).toBeInTheDocument();
  });
});
