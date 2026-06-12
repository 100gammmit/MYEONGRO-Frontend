import { fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { describe, expect, it, vi } from "vitest";

import { MAJOR_ARCANA } from "@/domain/tarot";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("./consent-gate", () => ({
  ConsentGate: ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => {
      onComplete();
    }, [onComplete]);
    return null;
  },
}));

import { TarotExperience } from "./tarot-experience";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createReadingResponse() {
  return new Response(
    JSON.stringify({
      reading: {
        id: "reading-1",
        status: "completed",
        result: {
          title: "세 장의 흐름이 답을 보여줍니다",
          summary: "선택한 카드들은 질문에 대한 현재의 맥락과 다음 행동을 함께 보여줍니다.",
          sections: [
            { heading: "현재의 흐름", body: "지금은 속도를 조절하며 핵심을 다시 보는 시기입니다." },
            { heading: "다음의 선택", body: "주저하던 방향으로 한 걸음 옮기면 흐름이 살아납니다." },
          ],
          guidance: ["선택을 너무 미루지 마세요.", "가장 현실적인 한 가지를 먼저 실행하세요."],
          disclaimer: "이 리딩은 오락과 자기성찰을 위한 참고 자료입니다.",
        },
      },
    }),
    { status: 200 },
  );
}

describe("TarotExperience", () => {
  it("submits exactly three selected major arcana cards and renders the reading result", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
    const submit = deferred<Response>();
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(() => submit.promise);

    render(<TarotExperience />);

    const question = await screen.findByRole("textbox");
    fireEvent.change(question, { target: { value: "새로운 선택이 맞는지 알고 싶어요" } });

    fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));

    const cardButtons = MAJOR_ARCANA.slice(0, 3).map((card) =>
      screen.getByRole("button", { name: card.name }),
    );
    fireEvent.click(cardButtons[0]);
    fireEvent.click(cardButtons[1]);
    fireEvent.click(cardButtons[2]);

    const readingButton = screen.getByRole("button", { name: "리딩 받기" });
    expect(readingButton).toBeEnabled();

    fireEvent.click(readingButton);
    fireEvent.click(readingButton);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText("카드를 읽는 중")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenLastCalledWith(
      "/api/readings",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          kind: "tarot",
          question: "새로운 선택이 맞는지 알고 싶어요",
          requestId: "11111111-1111-4111-8111-111111111111",
          cardIds: MAJOR_ARCANA.slice(0, 3).map((card) => card.id),
        }),
      }),
    );

    submit.resolve(createReadingResponse());

    await screen.findByRole("heading", { name: "세 장의 흐름이 답을 보여줍니다" });

    expect(screen.getByText("세 장의 흐름이 답을 보여줍니다")).toBeInTheDocument();
    expect(screen.getByText(/선택한 카드들은 질문에 대한 현재의 맥락/)).toBeInTheDocument();
    expect(screen.getByText("현재의 흐름")).toBeInTheDocument();
    expect(screen.getByText("다음의 선택")).toBeInTheDocument();
    expect(screen.getByText("선택을 너무 미루지 마세요.")).toBeInTheDocument();
    expect(screen.getByText("이 리딩은 오락과 자기성찰을 위한 참고 자료입니다.")).toBeInTheDocument();

    for (const card of MAJOR_ARCANA.slice(0, 3)) {
      expect(screen.getByText(card.name)).toBeInTheDocument();
    }

    randomUUID.mockRestore();
    fetchMock.mockRestore();
  });

  it("retries a failed request with the same requestId and then renders the reading", async () => {
    const randomUUID = vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "22222222-2222-4222-8222-222222222222",
    );
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: "nope" }), { status: 500 }))
      .mockResolvedValueOnce(createReadingResponse());

    render(<TarotExperience />);

    fireEvent.change(await screen.findByRole("textbox"), {
      target: { value: "선택이 막막해서 방향을 보고 싶어요" },
    });
    fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));

    for (const card of MAJOR_ARCANA.slice(0, 3)) {
      fireEvent.click(screen.getByRole("button", { name: card.name }));
    }

    fireEvent.click(screen.getByRole("button", { name: "리딩 받기" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "타로 리딩을 불러오지 못했어요. 다시 시도해 주세요.",
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

    await screen.findByRole("heading", { name: "세 장의 흐름이 답을 보여줍니다" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(fetchMock.mock.calls[1]?.[1]?.body);
    expect(fetchMock.mock.calls[0]?.[1]?.body).toContain(
      '"requestId":"22222222-2222-4222-8222-222222222222"',
    );

    randomUUID.mockRestore();
    fetchMock.mockRestore();
  });

  it("renders all 22 major arcana cards and keeps selection capped at three", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(createReadingResponse());

    render(<TarotExperience />);

    fireEvent.change(await screen.findByRole("textbox"), {
      target: { value: "내가 지금 봐야 할 흐름이 궁금해요" },
    });
    fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));

    expect(MAJOR_ARCANA).toHaveLength(22);
    for (const card of MAJOR_ARCANA) {
      expect(screen.getByRole("button", { name: card.name })).toBeInTheDocument();
    }

    for (const card of MAJOR_ARCANA.slice(0, 4)) {
      fireEvent.click(screen.getByRole("button", { name: card.name }));
    }

    expect(screen.getByText("선택한 카드 3 / 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "리딩 받기" })).toBeEnabled();

    fetchMock.mockRestore();
  });
});
