import { render, screen } from "@testing-library/react";
import { ReadingShell } from "./reading-shell";

describe("ReadingShell", () => {
  it("shows the current step and progress", () => {
    render(
      <ReadingShell eyebrow="AI 타로" title="질문을 들려주세요" step={2} totalSteps={4}>
        <p>content</p>
      </ReadingShell>,
    );

    expect(screen.getByText("2 / 4")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "질문을 들려주세요" })).toBeInTheDocument();
  });
});
