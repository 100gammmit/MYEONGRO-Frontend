import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useEffect } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  MAJOR_ARCANA,
  TAROT_SPREADS,
  type TarotDrawComplete,
  type TarotDrawInProgress,
  type TarotSpreadType,
} from "@/domain/tarot";

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

const AUTHENTICATED = Response.json({
  authenticated: true,
  user: { id: "user-1" },
});

function drawNotFound() {
  return Response.json(
    { code: "DRAW_SESSION_NOT_FOUND", message: "진행 중인 추첨이 없습니다." },
    { status: 404 },
  );
}

function makeInProgress(
  spreadType: TarotSpreadType,
  selectedCount = 0,
): TarotDrawInProgress {
  const definition = TAROT_SPREADS[spreadType];
  return {
    drawSessionId: `draw-${spreadType}`,
    spreadType,
    status: "in_progress",
    currentPosition: definition.positions[selectedCount].id,
    selectedCount,
    totalCount: definition.cardCount,
    expiresAt: "2026-07-17T12:30:00Z",
    candidates: Array.from({ length: 5 }, (_, index) => ({
      token: `opaque-${selectedCount}-${index + 1}`,
    })),
  };
}

function makeComplete(spreadType: TarotSpreadType): TarotDrawComplete {
  const definition = TAROT_SPREADS[spreadType];
  return {
    drawSessionId: `draw-${spreadType}`,
    spreadType,
    status: "complete",
    selectedCount: definition.cardCount,
    totalCount: definition.cardCount,
    expiresAt: "2026-07-17T12:30:00Z",
    cards: definition.positions.map((position, index) => ({
      position: position.id,
      cardId: MAJOR_ARCANA[index].id,
      reversed: false,
    })),
  };
}

function readingResponse(complete: TarotDrawComplete) {
  const definition = TAROT_SPREADS[complete.spreadType];
  return Response.json({
    reading: {
      id: "reading-1",
      kind: "tarot",
      spreadType: complete.spreadType,
      schemaVersion: 1,
      status: "completed",
      title: "완성된 리딩",
      input: {
        question: "질문",
        cards: complete.cards,
      },
      result: {
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
      createdAt: "2026-07-17T00:00:00Z",
      updatedAt: "2026-07-17T00:00:01Z",
    },
  });
}

async function chooseSpreadAndStart(spreadType: TarotSpreadType) {
  const definition = TAROT_SPREADS[spreadType];
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

describe("TarotExperience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigation.push.mockReset();
    sessionStorage.clear();
    localStorage.clear();
  });

  it("requires authentication before rendering the spread choices", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      Response.json({ authenticated: false }),
    );

    render(<TarotExperience />);

    expect(screen.queryByRole("button", { name: /오늘의 한 장/ })).not.toBeInTheDocument();
    await waitFor(() => expect(navigation.push).toHaveBeenCalledWith("/login?next=%2Ftarot"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith("/api/me", { credentials: "same-origin" });
  });

  it("shows a retryable auth error instead of redirecting on a backend failure", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(Response.json({ code: "BACKEND_UNAVAILABLE" }, { status: 502 }));

    render(<TarotExperience />);

    expect(await screen.findByRole("alert")).toHaveTextContent("로그인 상태를 확인하지 못했어요");
    expect(screen.getByRole("button", { name: "로그인 상태 다시 확인" })).toBeInTheDocument();
    expect(navigation.push).not.toHaveBeenCalled();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("renders only opaque hidden candidates and removes the legacy card-ID draft", async () => {
    sessionStorage.setItem("myeongro:tarot-draft", JSON.stringify({
      spreadType: "mind_three_card",
      cardIds: ["major-17-star"],
    }));
    const initial = makeInProgress("mind_three_card");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return drawNotFound();
      if (input === "/api/tarot/draw-sessions" && init?.method === "POST") {
        return Response.json(initial);
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    const { container } = render(<TarotExperience />);
    await chooseSpreadAndStart("mind_three_card");

    expect(JSON.stringify(initial)).not.toContain("cardId");
    expect(screen.getAllByRole("button", { name: /숨은 카드 [1-5]/ })).toHaveLength(5);
    expect(container.innerHTML).not.toContain("major-");
    expect(container.innerHTML).not.toContain("opaque-");
    expect(sessionStorage.getItem("myeongro:tarot-draft")).toBeNull();
    const safeDraft = sessionStorage.getItem("myeongro:tarot-draw-draft-v2") ?? "";
    expect(safeDraft).toContain(initial.drawSessionId);
    expect(safeDraft).not.toContain("cardId");
    expect(safeDraft).not.toContain("opaque-");
    expect(fetchMock).toHaveBeenCalledWith("/api/tarot/draw-sessions", expect.objectContaining({
      method: "POST",
      body: JSON.stringify({ spreadType: "mind_three_card" }),
    }));
  });

  it.each([
    ["click", ""],
    ["Enter", "Enter"],
    ["Space", " "],
  ])("submits exactly once when a candidate is activated by %s", async (_label, key) => {
    const initial = makeInProgress("daily_one_card");
    const complete = makeComplete("daily_one_card");
    let selectionCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return drawNotFound();
      if (input === "/api/tarot/draw-sessions" && init?.method === "POST") return Response.json(initial);
      if (String(input).endsWith("/selections")) {
        selectionCalls += 1;
        return Response.json(complete);
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    await chooseSpreadAndStart("daily_one_card");
    const candidate = screen.getByRole("button", { name: "숨은 카드 1" });

    fireEvent.focus(candidate);
    fireEvent.mouseEnter(candidate);
    expect(selectionCalls).toBe(0);
    if (key) fireEvent.keyDown(candidate, { key });
    else fireEvent.click(candidate);

    await screen.findByText(MAJOR_ARCANA[0].name);
    expect(selectionCalls).toBe(1);
  });

  it("blocks duplicate candidate submissions while the first request is pending", async () => {
    const initial = makeInProgress("daily_one_card");
    const complete = makeComplete("daily_one_card");
    let resolveSelection: ((response: Response) => void) | undefined;
    const pendingSelection = new Promise<Response>((resolve) => {
      resolveSelection = resolve;
    });
    let selectionCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return drawNotFound();
      if (input === "/api/tarot/draw-sessions" && init?.method === "POST") return Response.json(initial);
      if (String(input).endsWith("/selections")) {
        selectionCalls += 1;
        return pendingSelection;
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    await chooseSpreadAndStart("daily_one_card");
    const candidate = screen.getByRole("button", { name: "숨은 카드 1" });
    fireEvent.click(candidate);
    fireEvent.click(candidate);
    fireEvent.keyDown(candidate, { key: "Enter" });

    expect(selectionCalls).toBe(1);
    resolveSelection?.(Response.json(complete));
    await screen.findByText(MAJOR_ARCANA[0].name);
  });

  it.each(["mind_three_card", "choice_five_card"] as const)(
    "keeps %s cards secret until complete and then reveals ordered cards",
    async (spreadType) => {
      const definition = TAROT_SPREADS[spreadType];
      const initial = makeInProgress(spreadType);
      const complete = makeComplete(spreadType);
      let selectedCount = 0;
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
        if (input === "/api/me") return AUTHENTICATED.clone();
        if (input === "/api/tarot/draw-sessions/active") return drawNotFound();
        if (input === "/api/tarot/draw-sessions" && init?.method === "POST") return Response.json(initial);
        if (String(input).endsWith("/selections")) {
          selectedCount += 1;
          return Response.json(
            selectedCount === definition.cardCount
              ? complete
              : makeInProgress(spreadType, selectedCount),
          );
        }
        throw new Error(`unexpected fetch: ${String(input)}`);
      });

      const { container } = render(<TarotExperience />);
      await chooseSpreadAndStart(spreadType);

      for (let round = 1; round <= definition.cardCount; round += 1) {
        expect(container.innerHTML).not.toContain(MAJOR_ARCANA[0].id);
        expect(screen.queryByText(MAJOR_ARCANA[0].name)).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole("button", { name: "숨은 카드 1" }));
        if (round < definition.cardCount) {
          await screen.findByText(`${round + 1} / ${definition.cardCount}`);
          expect(screen.queryByRole("button", { name: /변경|되돌리기|이전/ })).not.toBeInTheDocument();
        }
      }

      for (let index = 0; index < definition.cardCount; index += 1) {
        expect(await screen.findByText(MAJOR_ARCANA[index].name)).toBeInTheDocument();
      }
      expect(container.innerHTML).not.toContain("opaque-");
    },
  );

  it.each(["in_progress", "complete"] as const)(
    "restores an active %s draw after authentication without creating a session",
    async (status) => {
      const state = status === "in_progress"
        ? makeInProgress("mind_three_card", 1)
        : makeComplete("daily_one_card");
      const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        if (input === "/api/me") return AUTHENTICATED.clone();
        if (input === "/api/tarot/draw-sessions/active") return Response.json(state);
        throw new Error(`unexpected fetch: ${String(input)}`);
      });

      render(<TarotExperience />);

      if (status === "in_progress") {
        expect(await screen.findByText("2 / 3")).toBeInTheDocument();
        expect(screen.getByText("1개 위치 확정")).toBeInTheDocument();
        expect(screen.getByRole("img", {
          name: "지금의 감정 확정 카드 뒷면",
        })).toBeInTheDocument();
      } else {
        expect(await screen.findByText(MAJOR_ARCANA[0].name)).toBeInTheDocument();
      }
      expect(fetchMock).not.toHaveBeenCalledWith(
        "/api/tarot/draw-sessions",
        expect.objectContaining({ method: "POST" }),
      );
    },
  );

  it("does not create a new session until explicit abandon succeeds", async () => {
    const active = makeInProgress("mind_three_card", 1);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return Response.json(active);
      if (String(input) === `/api/tarot/draw-sessions/${active.drawSessionId}` && init?.method === "DELETE") {
        return new Response(null, { status: 204 });
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    await screen.findByText("2 / 3");
    fireEvent.click(screen.getByRole("button", { name: "새 추첨 시작" }));

    expect(screen.getByText("기존 추첨을 포기할까요?")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(expect.stringMatching(/draw-sessions$/), expect.objectContaining({
      method: "POST",
    }));
    expect(fetchMock).not.toHaveBeenCalledWith(
      `/api/tarot/draw-sessions/${active.drawSessionId}`,
      expect.anything(),
    );

    fireEvent.click(screen.getByRole("button", { name: "기존 추첨 포기" }));
    expect(await screen.findByRole("button", { name: /오늘의 한 장/ })).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      `/api/tarot/draw-sessions/${active.drawSessionId}`,
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  it("recovers a state conflict from active state without resending the token", async () => {
    const initial = makeInProgress("mind_three_card");
    const recovered = makeInProgress("mind_three_card", 1);
    let activeCalls = 0;
    let selectionCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") {
        activeCalls += 1;
        return activeCalls === 1 ? drawNotFound() : Response.json(recovered);
      }
      if (input === "/api/tarot/draw-sessions" && init?.method === "POST") return Response.json(initial);
      if (String(input).endsWith("/selections")) {
        selectionCalls += 1;
        return Response.json(
          { code: "DRAW_SESSION_STATE_CONFLICT", message: "상태가 변경되었습니다." },
          { status: 409 },
        );
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    await chooseSpreadAndStart("mind_three_card");
    fireEvent.click(screen.getByRole("button", { name: "숨은 카드 1" }));

    expect(await screen.findByText("2 / 3")).toBeInTheDocument();
    expect(selectionCalls).toBe(1);
    expect(activeCalls).toBe(2);
  });

  it("offers continue or explicit abandon after DRAW_SESSION_ACTIVE", async () => {
    const active = makeInProgress("relationship_three_card", 1);
    let activeCalls = 0;
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") {
        activeCalls += 1;
        return activeCalls === 1 ? drawNotFound() : Response.json(active);
      }
      if (input === "/api/tarot/draw-sessions" && init?.method === "POST") {
        return Response.json(
          { code: "DRAW_SESSION_ACTIVE", message: "진행 중인 추첨이 있습니다." },
          { status: 409 },
        );
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    fireEvent.click(await screen.findByRole("button", { name: /오늘의 한 장/ }));
    fireEvent.click(screen.getByRole("button", { name: "이 유형으로 시작" }));
    fireEvent.click(screen.getByRole("button", { name: "카드 고르러 가기" }));

    expect(await screen.findByText("진행 중인 추첨이 있어요")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기존 추첨 이어가기" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "새 추첨 시작" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      `/api/tarot/draw-sessions/${active.drawSessionId}`,
      expect.anything(),
    );
  });

  it("returns to the new-session start after DRAW_SESSION_NOT_FOUND", async () => {
    const initial = makeInProgress("daily_one_card");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return drawNotFound();
      if (input === "/api/tarot/draw-sessions" && init?.method === "POST") return Response.json(initial);
      if (String(input).endsWith("/selections")) {
        return Response.json(
          { code: "DRAW_SESSION_NOT_FOUND", message: "추첨이 만료되었습니다." },
          { status: 404 },
        );
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    await chooseSpreadAndStart("daily_one_card");
    fireEvent.click(screen.getByRole("button", { name: "숨은 카드 1" }));

    expect(await screen.findByRole("button", { name: /오늘의 한 장/ })).toBeInTheDocument();
    expect(sessionStorage.getItem("myeongro:tarot-draw-draft-v2")).toBeNull();
  });

  it("keeps the server session and never falls back after a selection 502", async () => {
    const initial = makeInProgress("daily_one_card");
    let activeCalls = 0;
    let selectionCalls = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") {
        activeCalls += 1;
        return activeCalls === 1 ? drawNotFound() : Response.json(initial);
      }
      if (input === "/api/tarot/draw-sessions" && init?.method === "POST") return Response.json(initial);
      if (String(input).endsWith("/selections")) {
        selectionCalls += 1;
        return Response.json({ code: "BACKEND_UNAVAILABLE", message: "연결 실패" }, { status: 502 });
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    await chooseSpreadAndStart("daily_one_card");
    fireEvent.click(screen.getByRole("button", { name: "숨은 카드 1" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("서버 상태를 확인하지 못했어요");
    expect(selectionCalls).toBe(1);
    fireEvent.click(screen.getByRole("button", { name: "서버 상태 다시 확인" }));
    expect(await screen.findByText("1 / 1")).toBeInTheDocument();
    expect(selectionCalls).toBe(1);
    expect(activeCalls).toBe(2);
  });

  it("submits drawSessionId without cards or candidate data when creating a reading", async () => {
    const complete = makeComplete("choice_five_card");
    sessionStorage.setItem("myeongro:tarot-draw-draft-v2", JSON.stringify({
      version: 2,
      spreadType: "choice_five_card",
      question: "현재 일을 유지할지 새로운 기회를 준비할지 고민돼요.",
      choiceOptions: { a: "현재를 유지한다", b: "새로운 기회를 준비한다" },
      drawSessionId: complete.drawSessionId,
    }));
    vi.spyOn(globalThis.crypto, "randomUUID").mockReturnValue(
      "11111111-1111-4111-8111-111111111111",
    );
    let submittedBody: Record<string, unknown> = {};
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return Response.json(complete);
      if (input === "/api/readings") {
        submittedBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
        return readingResponse(complete);
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "동의 확인 후 리딩 생성" }));

    await screen.findByRole("button", { name: "첫 카드 공개" });
    expect(submittedBody).toEqual({
      kind: "tarot",
      spreadType: "choice_five_card",
      question: "현재 일을 유지할지 새로운 기회를 준비할지 고민돼요.",
      requestId: "11111111-1111-4111-8111-111111111111",
      drawSessionId: complete.drawSessionId,
      choiceOptions: { a: "현재를 유지한다", b: "새로운 기회를 준비한다" },
    });
    expect(submittedBody).not.toHaveProperty("cardIds");
    expect(submittedBody).not.toHaveProperty("candidateToken");
    expect(submittedBody).not.toHaveProperty("position");
    expect(submittedBody).not.toHaveProperty("schemaVersion");
  });

  it("guides an already-consumed draw to records or a new start", async () => {
    const complete = makeComplete("daily_one_card");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return Response.json(complete);
      if (input === "/api/readings") {
        return Response.json(
          { code: "DRAW_SESSION_ALREADY_CONSUMED", message: "이미 소비된 추첨입니다." },
          { status: 409 },
        );
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "동의 확인 후 리딩 생성" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("이미 이 추첨으로 리딩이 생성되었어요");
    expect(screen.getByRole("link", { name: "기존 기록 확인" })).toHaveAttribute("href", "/records");
    expect(screen.getByRole("button", { name: "새 추첨 준비" })).toBeInTheDocument();
  });

  it.each([0, 2, undefined])(
    "rejects an unsupported reading schemaVersion (%s)",
    async (schemaVersion) => {
      const complete = makeComplete("daily_one_card");
      vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
        if (input === "/api/me") return AUTHENTICATED.clone();
        if (input === "/api/tarot/draw-sessions/active") return Response.json(complete);
        if (input === "/api/readings") {
          const response = await readingResponse(complete).json() as {
            reading: Record<string, unknown>;
          };
          if (schemaVersion === undefined) delete response.reading.schemaVersion;
          else response.reading.schemaVersion = schemaVersion;
          return Response.json(response);
        }
        throw new Error(`unexpected fetch: ${String(input)}`);
      });

      render(<TarotExperience />);
      fireEvent.click(await screen.findByRole("button", { name: "동의 확인 후 리딩 생성" }));

      expect(await screen.findByRole("alert")).toHaveTextContent("리딩 결과 계약");
      expect(screen.queryByText("완성된 리딩")).not.toBeInTheDocument();
    },
  );

  it("rejects a reading whose card position differs from the completed draw", async () => {
    const complete = makeComplete("daily_one_card");
    vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (input === "/api/me") return AUTHENTICATED.clone();
      if (input === "/api/tarot/draw-sessions/active") return Response.json(complete);
      if (input === "/api/readings") {
        const response = await readingResponse(complete).json() as {
          reading: {
            input: { cards: Array<{ position: string }> };
          };
        };
        response.reading.input.cards[0].position = "emotion";
        return Response.json(response);
      }
      throw new Error(`unexpected fetch: ${String(input)}`);
    });

    render(<TarotExperience />);
    fireEvent.click(await screen.findByRole("button", { name: "동의 확인 후 리딩 생성" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "리딩 결과의 카드와 해석 위치가 일치하지 않습니다.",
    );
  });
});
