import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

import { ReadingLoading, type ReadingLoadingMessages } from "./reading-loading";

const MESSAGES: ReadingLoadingMessages = ["첫째", "둘째", "셋째", "넷째"];

function litStrokes() {
  return document.querySelectorAll(".mark-stroke.on").length;
}

describe("ReadingLoading", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("lights one stroke per message every four seconds and breathes after the fourth", () => {
    render(<ReadingLoading messages={MESSAGES} />);

    expect(screen.getByText("첫째")).toBeInTheDocument();
    expect(litStrokes()).toBe(1);

    act(() => { vi.advanceTimersByTime(4_000); });
    expect(screen.getByText("둘째")).toBeInTheDocument();
    expect(screen.queryByText("첫째")).not.toBeInTheDocument();
    expect(litStrokes()).toBe(2);
    expect(document.querySelector(".mark-glyph.breathing")).toBeNull();

    act(() => { vi.advanceTimersByTime(8_000); });
    expect(screen.getByText("넷째")).toBeInTheDocument();
    expect(litStrokes()).toBe(4);
    expect(document.querySelector(".mark-glyph.breathing")).not.toBeNull();

    act(() => { vi.advanceTimersByTime(4_000); });
    expect(screen.getByText("넷째")).toBeInTheDocument();
  });

  it("adds the patience line only once twenty seconds have passed", () => {
    render(<ReadingLoading messages={MESSAGES} />);

    act(() => { vi.advanceTimersByTime(19_999); });
    expect(screen.queryByText(/조금 더 걸리고 있어요/)).not.toBeInTheDocument();

    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText("조금 더 걸리고 있어요. 잠시만 기다려 주세요.")).toBeInTheDocument();
  });

  it("announces the messages politely and starts over each time it appears", () => {
    const { unmount } = render(<ReadingLoading messages={MESSAGES} />);
    expect(screen.getByText("첫째").parentElement).toHaveAttribute("aria-live", "polite");

    act(() => { vi.advanceTimersByTime(20_000); });
    unmount();
    render(<ReadingLoading messages={MESSAGES} />);

    expect(screen.getByText("첫째")).toBeInTheDocument();
    expect(litStrokes()).toBe(1);
    expect(screen.queryByText(/조금 더 걸리고 있어요/)).not.toBeInTheDocument();
  });
});
