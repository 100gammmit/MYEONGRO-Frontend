import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { MAJOR_ARCANA, TAROT_SPREADS } from "@/domain/tarot";

const navigation = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => navigation,
}));

vi.mock("./consent-gate", () => ({
  ConsentGate: ({ onComplete }: { onComplete: () => void }) => {
    useEffect(() => onComplete(), [onComplete]);
    return null;
  },
}));

import { TarotExperience } from "./tarot-experience";

function chooseHiddenCardAndContinue(round: number, total: number) {
  expect(screen.getByText(`${round} / ${total}`)).toBeInTheDocument();
  const hiddenCards = screen.getAllByRole("button", { name: /숨은 카드 [1-5]/ });
  expect(hiddenCards).toHaveLength(5);
  fireEvent.click(hiddenCards[0]);
  expect(screen.getByText(/선택한 카드/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", {
    name: round === total ? "선택 완료" : "다음 카드 선택",
  }));
}

function startDailyReading() {
  fireEvent.click(screen.getByRole("button", { name: /오늘의 한 장/ }));
  fireEvent.click(screen.getByRole("button", { name: "이 유형으로 시작" }));
  fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));
  chooseHiddenCardAndContinue(1, 1);
}

function storeDailyDraft() {
  sessionStorage.setItem("myeongro:tarot-draft", JSON.stringify({
    spreadType: "daily_one_card",
    question: "",
    choiceOptions: { a: "", b: "" },
    cardIds: ["major-17-star"],
  }));
}

describe("TarotExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigation.push.mockReset();
    sessionStorage.clear();
  });

  it("offers all four spreads and shows only five hidden candidates for a position", () => {
    render(<TarotExperience />);

    for (const spread of Object.values(TAROT_SPREADS)) {
      expect(screen.getByRole("button", { name: new RegExp(spread.name) })).toBeInTheDocument();
    }

    fireEvent.click(screen.getByRole("button", { name: /마음 정리 3장/ }));
    fireEvent.click(screen.getByRole("button", { name: "이 유형으로 시작" }));
    fireEvent.change(screen.getByRole("textbox", { name: "카드에게 묻고 싶은 질문" }), {
      target: { value: "지금 내 감정을 어떻게 돌보면 좋을까요?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));

    expect(screen.getAllByRole("button", { name: /숨은 카드 [1-5]/ })).toHaveLength(5);
    expect(screen.queryByText(MAJOR_ARCANA[0].id)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: MAJOR_ARCANA[0].name })).not.toBeInTheDocument();
  });

  it("preserves the draft and routes an unauthenticated user to login without calling readings", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ authenticated: false }),
    );

    render(<TarotExperience />);
    startDailyReading();
    fireEvent.click(screen.getByRole("button", { name: "로그인 확인 후 리딩 생성" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/login?next=%2Ftarot"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/me", { credentials: "same-origin" });
    expect(fetchMock).not.toHaveBeenCalledWith("/api/readings", expect.anything());

    const stored = sessionStorage.getItem("myeongro:tarot-draft");
    expect(stored).toContain("daily_one_card");
    expect(navigation.push.mock.calls[0][0]).not.toContain("question");
  });

  it("keeps the draft and shows an error when the login check backend is unavailable", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ code: "BACKEND_UNAVAILABLE" }, { status: 502 }),
    );

    render(<TarotExperience />);
    startDailyReading();
    fireEvent.click(screen.getByRole("button", { name: /리딩 생성/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "로그인 상태를 확인하지 못했어요",
    );
    expect(navigation.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).not.toHaveBeenCalledWith("/api/readings", expect.anything());
    expect(sessionStorage.getItem("myeongro:tarot-draft")).toContain("daily_one_card");
  });

  it("submits choice cards in selection order and reveals matching sections by position", async () => {
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
    let submittedBody: Record<string, unknown> = {};
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") {
        return Response.json({ authenticated: true, user: { id: "user-1" } });
      }
      if (input === "/api/readings") {
        submittedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        const cardIds = submittedBody.cardIds as string[];
        return Response.json({
          reading: {
            id: "reading-1",
            kind: "tarot",
            spreadType: "choice_five_card",
            schemaVersion: 1,
            status: "completed",
            title: "선택의 기준을 세우는 리딩",
            input: {
              question: submittedBody.question,
              cards: TAROT_SPREADS.choice_five_card.positions.map((position, index) => ({
                cardId: cardIds[index],
                position: position.id,
                reversed: false,
              })),
            },
            result: {
              title: "선택의 기준을 세우는 리딩",
              summary: "두 선택을 중요한 가치에 비추어 살펴봅니다.",
              sections: TAROT_SPREADS.choice_five_card.positions.map((position) => ({
                position: position.id,
                heading: `${position.label} 해석`,
                body: `${position.id} 본문`,
              })),
              guidance: ["확인할 조건을 적어보세요.", "작은 실험부터 시작해 보세요."],
              disclaimer: "이 해석은 자기 성찰과 오락을 위한 참고 정보입니다.",
            },
            createdAt: "2026-07-15T00:00:00Z",
            updatedAt: "2026-07-15T00:00:01Z",
          },
        });
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    fireEvent.click(screen.getByRole("button", { name: /선택 리딩 5장/ }));
    fireEvent.click(screen.getByRole("button", { name: "이 유형으로 시작" }));
    fireEvent.change(screen.getByRole("textbox", { name: "카드에게 묻고 싶은 질문" }), {
      target: { value: "현재 일을 유지할지 새로운 기회를 준비할지 고민돼요." },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "선택 A" }), {
      target: { value: "현재 일을 유지한다" },
    });
    fireEvent.change(screen.getByRole("textbox", { name: "선택 B" }), {
      target: { value: "새로운 기회를 준비한다" },
    });
    fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));
    for (let round = 1; round <= 5; round += 1) {
      chooseHiddenCardAndContinue(round, 5);
    }
    fireEvent.click(screen.getByRole("button", { name: "로그인 확인 후 리딩 생성" }));

    await screen.findByRole("button", { name: "첫 카드 공개" });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(submittedBody).toMatchObject({
      kind: "tarot",
      spreadType: "choice_five_card",
      question: "현재 일을 유지할지 새로운 기회를 준비할지 고민돼요.",
      requestId: "11111111-1111-4111-8111-111111111111",
      choiceOptions: { a: "현재 일을 유지한다", b: "새로운 기회를 준비한다" },
    });
    expect((submittedBody.cardIds as string[])).toHaveLength(5);
    expect(new Set(submittedBody.cardIds as string[]).size).toBe(5);
    expect(submittedBody).not.toHaveProperty("positions");
    expect(submittedBody).not.toHaveProperty("candidateSets");
    expect(submittedBody).not.toHaveProperty("schemaVersion");

    fireEvent.click(screen.getByRole("button", { name: "첫 카드 공개" }));
    expect(screen.getByRole("heading", { name: "원하는 것 해석" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "두려운 것 해석" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "다음 카드 공개" }));
    expect(screen.getByRole("heading", { name: "두려운 것 해석" })).toBeInTheDocument();
  });

  it.each([
    [403, "필수 동의를 완료한 뒤 다시 리딩을 생성해 주세요."],
    [409, "같은 요청을 처리하고 있어요. 잠시 후 다시 확인해 주세요."],
    [429, "오늘의 무료 리딩 이용 한도에 도달했어요."],
    [502, "리딩 생성에 실패했어요. 잠시 후 다시 시도해 주세요."],
  ])("shows the %i reading API state without a fallback result", async (status, message) => {
    storeDailyDraft();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (input === "/api/me") {
        return Response.json({ authenticated: true, user: { id: "user-1" } });
      }
      return Response.json({ code: "ERROR", message }, { status });
    });

    render(<TarotExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "로그인 확인 후 리딩 생성" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(message);
    expect(screen.queryByText("YOUR READING")).not.toBeInTheDocument();
  });

  it("routes a reading API 401 to login without automatically retrying", async () => {
    storeDailyDraft();
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(Response.json({ authenticated: true, user: { id: "user-1" } }))
      .mockResolvedValueOnce(
        Response.json({ code: "UNAUTHENTICATED", message: "로그인이 필요합니다." }, { status: 401 }),
      );

    render(<TarotExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "로그인 확인 후 리딩 생성" }));

    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/login?next=%2Ftarot"));
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it.each([0, 2, undefined])(
    "rejects an unsupported reading schemaVersion (%s)",
    async (schemaVersion) => {
      storeDailyDraft();
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        if (input === "/api/me") {
          return Response.json({ authenticated: true, user: { id: "user-1" } });
        }
        return Response.json({
          reading: {
            spreadType: "daily_one_card",
            ...(schemaVersion === undefined ? {} : { schemaVersion }),
            input: {
              cards: [{ cardId: "major-17-star", position: "today", reversed: false }],
            },
            result: {
              title: "지원하지 않는 결과",
              summary: "표시하면 안 되는 결과",
              sections: [{ position: "today", heading: "오늘", body: "본문" }],
              guidance: ["조언"],
              disclaimer: "참고 정보",
            },
          },
        });
      });

      render(<TarotExperience />);
      fireEvent.click(await screen.findByRole("button", { name: /리딩 생성/ }));

      expect(await screen.findByRole("alert")).toHaveTextContent("리딩 결과 계약");
      expect(screen.queryByText("지원하지 않는 결과")).not.toBeInTheDocument();
    },
  );

  it("rejects a result whose section position does not match the selected spread", async () => {
    storeDailyDraft();
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (input === "/api/me") {
        return Response.json({ authenticated: true, user: { id: "user-1" } });
      }
      return Response.json({
        reading: {
          spreadType: "daily_one_card",
          schemaVersion: 1,
          input: {
            cards: [{ cardId: "major-17-star", position: "today", reversed: false }],
          },
          result: {
            title: "잘못된 결과",
            summary: "잘못된 요약",
            sections: [{ position: "emotion", heading: "잘못된 위치", body: "본문" }],
            guidance: ["조언"],
            disclaimer: "참고 정보",
          },
        },
      });
    });

    render(<TarotExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "로그인 확인 후 리딩 생성" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "리딩 결과의 카드와 해석 위치가 일치하지 않습니다.",
    );
    expect(screen.queryByText("잘못된 위치")).not.toBeInTheDocument();
  });
});
