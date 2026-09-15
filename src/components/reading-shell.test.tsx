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
    expect(screen.getByRole("link", { name: "← 홈으로" })).toHaveAttribute("href", "/");
  });

  it("shows a threshold label instead of counting it as a step", () => {
    const { container } = render(
      <ReadingShell eyebrow="AI SAJU" title="사주 리딩을 시작하기 전에" stepLabel="시작하기 전에">
        <p>content</p>
      </ReadingShell>,
    );

    expect(screen.getByText("시작하기 전에")).toBeInTheDocument();
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    expect(container.querySelector(".progress-track span")).toHaveStyle({ width: "0%" });
  });

  it("renders actions after the content and can hide the home link", () => {
    const { container } = render(
      <ReadingShell
        eyebrow="AI SAJU"
        title="출생 정보를 알려주세요"
        step={2}
        totalSteps={4}
        showHomeLink={false}
        actions={<button type="button">다음</button>}
      >
        <p>content</p>
      </ReadingShell>,
    );

    expect(screen.queryByRole("link", { name: "← 홈으로" })).not.toBeInTheDocument();
    const next = screen.getByRole("button", { name: "다음" });
    expect(next.closest(".reading-actions")).not.toBeNull();
    expect(screen.getByText("content").compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector("section")).not.toHaveClass("form-shell");
  });

  it("narrows an input wizard to the reading column", () => {
    const { container } = render(
      <ReadingShell eyebrow="AI SAJU" title="출생 정보를 알려주세요" step={2} totalSteps={4} form>
        <p>content</p>
      </ReadingShell>,
    );

    expect(container.querySelector("section")).toHaveClass("reading-shell", "form-shell");
  });
});
