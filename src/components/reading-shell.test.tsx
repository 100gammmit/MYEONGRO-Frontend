import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ReadingShell } from "./reading-shell";

describe("ReadingShell", () => {
  it("puts the reading's name beside the step count and leads home by default", () => {
    const { container } = render(
      <ReadingShell eyebrow="고민 리딩" title="상황을 들려주세요" step={1} totalSteps={3}>
        <p>content</p>
      </ReadingShell>,
    );

    const meta = container.querySelector(".step-meta");
    expect(meta).toHaveTextContent("고민 리딩");
    expect(meta).toHaveTextContent("1 / 3");
    expect(container.querySelector<HTMLElement>(".progress-track span")?.style.width).toMatch(/^33\.3/);
    expect(screen.getByRole("heading", { level: 1, name: "상황을 들려주세요" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "홈" })).toHaveAttribute("href", "/");
  });

  it("shows a threshold label without counting it or drawing progress", () => {
    const { container } = render(
      <ReadingShell eyebrow="AI 사주" title="사주 리딩을 시작하기 전에" stepLabel="시작하기 전에">
        <p>content</p>
      </ReadingShell>,
    );

    expect(screen.getByText("시작하기 전에")).toBeInTheDocument();
    expect(screen.queryByText(/\d+ \/ \d+/)).not.toBeInTheDocument();
    expect(container.querySelector(".progress-track")).toBeNull();
  });

  it("goes back with a button inside a wizard and can leave out the way back", () => {
    const back = vi.fn();
    const { rerender } = render(
      <ReadingShell eyebrow="AI 사주" title="출생 정보를 알려주세요" step={2} totalSteps={3} back={{ label: "이전", onClick: back }}>
        <p>content</p>
      </ReadingShell>,
    );

    fireEvent.click(screen.getByRole("button", { name: "이전" }));
    expect(back).toHaveBeenCalledTimes(1);

    rerender(
      <ReadingShell eyebrow="AI 사주" title="사주의 흐름을 읽고 있어요" step={3} totalSteps={3} back={null}>
        <p>content</p>
      </ReadingShell>,
    );
    expect(screen.queryByRole("button", { name: "이전" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });

  it("renders actions after the content", () => {
    render(
      <ReadingShell
        eyebrow="AI 사주"
        title="출생 정보를 알려주세요"
        step={2}
        totalSteps={3}
        actions={<button type="button">다음</button>}
      >
        <p>content</p>
      </ReadingShell>,
    );

    const next = screen.getByRole("button", { name: "다음" });
    expect(next.closest(".reading-actions")).not.toBeNull();
    expect(screen.getByText("content").compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("moves to the top and focuses the new title when the step changes, but not on arrival", () => {
    const scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const { rerender } = render(
      <ReadingShell eyebrow="고민 리딩" title="상황을 들려주세요" step={1} totalSteps={3}>
        <p>content</p>
      </ReadingShell>,
    );

    expect(screen.getByRole("heading", { level: 1 })).not.toHaveFocus();
    expect(scrollTo).not.toHaveBeenCalled();

    rerender(
      <ReadingShell eyebrow="고민 리딩" title="지금의 상황" step={2} totalSteps={3}>
        <p>content</p>
      </ReadingShell>,
    );

    expect(screen.getByRole("heading", { level: 1, name: "지금의 상황" })).toHaveFocus();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "instant" });
    scrollTo.mockRestore();
  });

  it("leaves focus alone when the step moves it itself", () => {
    const { rerender } = render(
      <ReadingShell eyebrow="무료 오늘의 운세" title="카드를 골라보세요" focusOnChange={false}>
        <p>content</p>
      </ReadingShell>,
    );

    rerender(
      <ReadingShell eyebrow="무료 오늘의 운세" title="오늘의 결과" focusOnChange={false}>
        <p>content</p>
      </ReadingShell>,
    );

    expect(screen.getByRole("heading", { level: 1 })).not.toHaveFocus();
  });
});
