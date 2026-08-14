import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAJOR_ARCANA, TAROT_SPREADS, type TarotSpreadType } from "@/domain/tarot";

const navigation = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));
const consent = vi.hoisted(() => ({ autoComplete: true }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("./consent-gate", () => ({
  ConsentGate: ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
      if (consent.autoComplete) onComplete();
    }, [onComplete]);
    return consent.autoComplete
      ? null
      : <button onClick={onComplete} type="button">동의 완료</button>;
  },
}));

import { TarotExperience } from "./tarot-experience";
import styles from "./tarot-experience.module.css";

function readingResponse(spreadType: TarotSpreadType) {
  const definition = TAROT_SPREADS[spreadType];
  const cards = definition.positions.map((position, index) => ({
    position: position.id,
    cardId: MAJOR_ARCANA[index].id,
    reversed: false,
  }));
  return Response.json({
    reading: {
      id: "reading-1",
      kind: "tarot",
      spreadType,
      schemaVersion: 1,
      status: "completed",
      title: "완성된 리딩",
      input: { question: "질문", cards },
      result: {
        readingMode: "standard",
        title: "완성된 리딩",
        summary: "카드의 흐름을 연결한 요약입니다.",
        sections: definition.positions.map((position) => ({
          position: position.id,
          heading: `${position.label} 해석`,
          body: `${position.id} 본문`,
        })),
        guidance: ["작은 행동을 시도해 보세요."],
        disclaimer: "자기 성찰과 오락을 위한 참고 정보입니다.",
      },
    },
  });
}

async function chooseSpreadAndStart(spreadType: TarotSpreadType) {
  const definition = TAROT_SPREADS[spreadType];
  render(<TarotExperience />);
  fireEvent.click(await screen.findByRole("button", { name: new RegExp(definition.name) }));
  fireEvent.click(screen.getByRole("button", { name: "이 유형으로 시작" }));

  if (definition.inputMode !== "fixed") {
    fireEvent.change(screen.getByRole("textbox", { name: "카드에게 묻고 싶은 질문" }), {
      target: { value: "지금 제 마음에서 살펴볼 흐름이 궁금해요." },
    });
  }
  if (definition.inputMode === "choice") {
    fireEvent.change(screen.getByRole("textbox", { name: "선택 A" }), {
      target: { value: "현재를 유지한다" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "선택 B" }), {
      target: { value: "새로운 기회를 준비한다" },
    });
  }

  fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));
  await screen.findByText(`1 / ${definition.cardCount}`);
}

function selectSlots(slots: readonly number[]) {
  for (const slot of slots) {
    fireEvent.click(screen.getByRole("button", { name: `숨은 카드 ${slot}` }));
  }
}

describe("TarotExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigation.push.mockReset();
    navigation.replace.mockReset();
    consent.autoComplete = true;
    sessionStorage.clear();
    localStorage.clear();
  });

  it("checks consent before showing spread choices and makes no draw request", async () => {
    consent.autoComplete = false;
    const fetchMock = vi.spyOn(globalThis, "fetch");

    render(<TarotExperience />);

    expect(screen.queryByText("어떤 마음을 들여다볼까요?")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "동의 완료" }));
    expect(await screen.findByText("어떤 마음을 들여다볼까요?")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([
    ["daily_one_card", [4]],
    ["mind_three_card", [5, 1, 3]],
    ["relationship_three_card", [2, 4, 1]],
    ["choice_five_card", [5, 4, 3, 2, 1]],
  ] as const)(
    "keeps %s selection local and renders five anonymous backs per position",
    async (spreadType, slots) => {
      const fetchMock = vi.spyOn(globalThis, "fetch");
      await chooseSpreadAndStart(spreadType);

      expect(screen.getAllByRole("button", { name: /숨은 카드/ })).toHaveLength(5);
      selectSlots(slots);

      expect(screen.queryByText("카드 선택을 마쳤어요")).not.toBeInTheDocument();
      expect(await screen.findByRole("button", { name: "리딩 생성" })).toBeEnabled();
      const completedCardBacks = screen.getAllByRole("button", { name: /숨은 카드/ });
      expect(completedCardBacks).toHaveLength(5);
      for (const button of completedCardBacks) {
        expect(button).toBeDisabled();
      }
      const selectedCard = screen.getByRole("button", {
        name: `숨은 카드 ${slots.at(-1)}`,
      });
      expect(selectedCard).toHaveAttribute("aria-pressed", "true");
      expect(selectedCard).toHaveClass(styles.selectedCard);
      for (const card of MAJOR_ARCANA) {
        expect(screen.queryByText(card.name)).not.toBeInTheDocument();
      }
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("submits ordered selectedSlots once without draw-session or card data", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      readingResponse("relationship_three_card"),
    );
    await chooseSpreadAndStart("relationship_three_card");
    selectSlots([5, 1, 3]);

    fireEvent.click(await screen.findByRole("button", { name: "리딩 생성" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/readings");
    const body = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      kind: "tarot",
      spreadType: "relationship_three_card",
      selectedSlots: [5, 1, 3],
    });
    expect(body).not.toHaveProperty("drawSessionId");
    expect(body).not.toHaveProperty("cardIds");
    expect(body).not.toHaveProperty("candidateSets");
    expect(navigation.push).toHaveBeenCalledWith("/tarot/results/reading-1");
  });

  it("does not show or trigger reading generation before the last card", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await chooseSpreadAndStart("mind_three_card");

    selectSlots([5, 1]);

    expect(screen.queryByRole("button", { name: "리딩 생성" })).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: "숨은 카드 3" }));

    const submitButton = await screen.findByRole("button", { name: "리딩 생성" });
    expect(submitButton).toBeEnabled();
    await waitFor(() => expect(submitButton).toHaveFocus());
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("retries the stored failed reading instead of creating it again", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        code: "OPENAI_READING_GENERATION_FAILED",
        message: "provider failed",
        readingId: "failed-reading-1",
      }, { status: 502 }))
      .mockResolvedValueOnce(readingResponse("daily_one_card"));
    await chooseSpreadAndStart("daily_one_card");
    selectSlots([2]);

    fireEvent.click(await screen.findByRole("button", { name: "리딩 생성" }));
    fireEvent.click(await screen.findByRole("button", { name: "같은 선택으로 다시 시도" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    const first = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(first.selectedSlots).toEqual([2]);
    expect(fetchMock.mock.calls[1][0]).toBe("/api/readings/failed-reading-1/retry");
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: "POST" });
    expect(fetchMock.mock.calls[1][1]).not.toHaveProperty("body");
  });

  it("recovers the failed reading id when the first 502 response is lost", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockRejectedValueOnce(new TypeError("network response lost"))
      .mockResolvedValueOnce(Response.json({
        code: "OPENAI_READING_GENERATION_FAILED",
        message: "provider failed",
        readingId: "failed-reading-2",
      }, { status: 502 }))
      .mockResolvedValueOnce(readingResponse("daily_one_card"));
    await chooseSpreadAndStart("daily_one_card");
    selectSlots([4]);

    fireEvent.click(await screen.findByRole("button", { name: "리딩 생성" }));
    fireEvent.click(await screen.findByRole("button", { name: "같은 선택으로 다시 시도" }));
    fireEvent.click(await screen.findByRole("button", { name: "같은 선택으로 다시 시도" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[0][0]).toBe("/api/readings");
    expect(fetchMock.mock.calls[1][0]).toBe("/api/readings");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/readings/failed-reading-2/retry");
    expect(navigation.push).toHaveBeenCalledWith("/tarot/results/reading-1");
  });

  it("recovers a completed retry when its success response is lost", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({
        code: "OPENAI_READING_GENERATION_FAILED",
        message: "provider failed",
        readingId: "failed-reading-3",
      }, { status: 502 }))
      .mockRejectedValueOnce(new TypeError("retry response lost"))
      .mockResolvedValueOnce(readingResponse("daily_one_card"));
    await chooseSpreadAndStart("daily_one_card");
    selectSlots([1]);

    fireEvent.click(await screen.findByRole("button", { name: "리딩 생성" }));
    fireEvent.click(await screen.findByRole("button", { name: "같은 선택으로 다시 시도" }));
    fireEvent.click(await screen.findByRole("button", { name: "같은 선택으로 다시 시도" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(fetchMock.mock.calls[1][0]).toBe("/api/readings/failed-reading-3/retry");
    expect(fetchMock.mock.calls[2][0]).toBe("/api/readings/failed-reading-3/retry");
    expect(navigation.push).toHaveBeenCalledWith("/tarot/results/reading-1");
  });

  it("starts over locally without calling an abandon endpoint", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    await chooseSpreadAndStart("mind_three_card");
    fireEvent.click(screen.getByRole("button", { name: "숨은 카드 3" }));

    fireEvent.click(screen.getByRole("button", { name: "처음부터 다시 선택" }));

    expect(await screen.findByText("어떤 마음을 들여다볼까요?")).toBeInTheDocument();
    expect(navigation.push).toHaveBeenCalledWith("/tarot");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not advance two positions from rapid duplicate clicks", async () => {
    await chooseSpreadAndStart("mind_three_card");
    const first = screen.getByRole("button", { name: "숨은 카드 2" });

    fireEvent.click(first);
    fireEvent.click(first);

    expect(await screen.findByText("2 / 3")).toBeInTheDocument();
    expect(screen.queryByText("카드 선택을 마쳤어요")).not.toBeInTheDocument();
  });
});
