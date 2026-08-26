import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  DAILY_CARD_CONTENT_VERSION,
  DAILY_CARD_STORAGE_KEY,
  getDailyCardContent,
  getKoreanDate,
} from "@/domain/daily-card-free";
import { DailyCardExperience } from "./daily-card-experience";

const drawId = "82ed11d5-2269-438c-9815-42e6f13735f4";

describe("DailyCardExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(drawId);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls the lightweight API once only after confirmation and saves the result", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(Response.json({
      selection: {
        dateKst: getKoreanDate(),
        cardId: "major-17-star",
        variantIndex: 3,
        contentVersion: DAILY_CARD_CONTENT_VERSION,
      },
    }));
    render(<DailyCardExperience />);

    fireEvent.click(await screen.findByRole("button", { name: "숨은 카드 3" }));
    expect(fetchMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "이 카드로 확인" }));

    expect(await screen.findByText("오늘의 카드 · 별")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toEqual({
      drawId,
      selectedSlot: 3,
      contentVersion: DAILY_CARD_CONTENT_VERSION,
    });
    expect(localStorage.getItem(DAILY_CARD_STORAGE_KEY)).toContain("major-17-star");
    const expectedContent = getDailyCardContent("major-17-star", 3);
    if (!expectedContent) {
      throw new Error("Expected fixture content to exist.");
    }
    expect(screen.getByRole("heading", { name: expectedContent.today.heading })).toHaveFocus();
  });

  it("restores today's result without another API call", async () => {
    localStorage.setItem(DAILY_CARD_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      contentVersion: DAILY_CARD_CONTENT_VERSION,
      dateKst: getKoreanDate(),
      drawId,
      cardId: "major-19-sun",
      variantIndex: 0,
    }));
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<DailyCardExperience />);

    expect(await screen.findByText("오늘의 카드 · 태양")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).not.toHaveBeenCalled());
  });

  it("reuses the same draw id when the selection response is lost", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("response lost"))
      .mockResolvedValueOnce(Response.json({
        selection: {
          dateKst: getKoreanDate(),
          cardId: "major-19-sun",
          variantIndex: 0,
          contentVersion: DAILY_CARD_CONTENT_VERSION,
        },
      }));
    render(<DailyCardExperience />);

    fireEvent.click(await screen.findByRole("button", { name: "숨은 카드 2" }));
    fireEvent.click(screen.getByRole("button", { name: "이 카드로 확인" }));
    fireEvent.click(await screen.findByRole("button", { name: "이 카드로 확인" }));

    expect(await screen.findByText("오늘의 카드 · 태양")).toBeInTheDocument();
    const first = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    const second = JSON.parse(String(fetchMock.mock.calls[1][1]?.body));
    expect(first.drawId).toBe(drawId);
    expect(second.drawId).toBe(drawId);
  });

  it("reschedules expiration across consecutive Korean midnights", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T14:59:59.000Z"));
    localStorage.setItem(DAILY_CARD_STORAGE_KEY, JSON.stringify({
      schemaVersion: 1,
      contentVersion: DAILY_CARD_CONTENT_VERSION,
      dateKst: "2026-08-25",
      drawId,
      cardId: "major-19-sun",
      variantIndex: 0,
    }));
    vi.spyOn(globalThis, "fetch").mockImplementation(async () => Response.json({
      selection: {
        dateKst: getKoreanDate(),
        cardId: "major-17-star",
        variantIndex: 3,
        contentVersion: DAILY_CARD_CONTENT_VERSION,
      },
    }));
    render(<DailyCardExperience />);

    expect(screen.getByText("오늘의 카드 · 태양")).toBeInTheDocument();
    await act(() => vi.advanceTimersByTimeAsync(1_000));
    expect(screen.getByRole("button", { name: "숨은 카드 1" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "숨은 카드 2" }));
    fireEvent.click(screen.getByRole("button", { name: "이 카드로 확인" }));
    await act(async () => undefined);
    expect(screen.getByText("오늘의 카드 · 별")).toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(24 * 60 * 60 * 1_000));
    expect(screen.getByRole("button", { name: "숨은 카드 1" })).toBeInTheDocument();
    expect(screen.queryByText("오늘의 카드 · 별")).not.toBeInTheDocument();
  });

  it("discards a previous-day response that arrives after Korean midnight", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-25T14:59:59.500Z"));
    let resolveFetch!: (response: Response) => void;
    vi.spyOn(globalThis, "fetch").mockReturnValue(new Promise((resolve) => {
      resolveFetch = resolve;
    }));
    render(<DailyCardExperience />);

    fireEvent.click(screen.getByRole("button", { name: "숨은 카드 3" }));
    fireEvent.click(screen.getByRole("button", { name: "이 카드로 확인" }));
    await act(() => vi.advanceTimersByTimeAsync(1_000));
    await act(async () => resolveFetch(Response.json({
      selection: {
        dateKst: "2026-08-25",
        cardId: "major-17-star",
        variantIndex: 3,
        contentVersion: DAILY_CARD_CONTENT_VERSION,
      },
    })));

    expect(screen.getByRole("button", { name: "숨은 카드 1" })).toBeInTheDocument();
    expect(screen.queryByText("오늘의 카드 · 별")).not.toBeInTheDocument();
    expect(localStorage.getItem(DAILY_CARD_STORAGE_KEY)).toBeNull();
  });
});
