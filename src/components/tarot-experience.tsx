"use client";

import { useCallback, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import {
  DAILY_QUESTION,
  MAJOR_ARCANA,
  TAROT_SPREAD_LIST,
  TAROT_SPREADS,
  createTarotReadingRequest,
  type TarotChoiceOptions,
  type TarotPositionId,
  type TarotSpreadType,
} from "@/domain/tarot";
import { parseDeclinedReadingView } from "@/domain/reading/declined-result";
import { ConsentGate } from "./consent-gate";
import { ReadingShell } from "./reading-shell";

const MAX_QUESTION_LENGTH = 300;
const MAX_CHOICE_LENGTH = 100;
const SLOT_COUNT = 5;

type Phase = "spread" | "input" | "draw" | "confirm" | "consent" | "loading" | "error";

type TarotReadingSection = {
  position: TarotPositionId;
  heading: string;
  body: string;
};

type TarotReadingResult = {
  title: string;
  summary: string;
  sections: TarotReadingSection[];
  guidance: string[];
  disclaimer: string;
};

type TarotReadingResponse = {
  reading: {
    id: string;
    spreadType: TarotSpreadType;
    schemaVersion: number;
    input: {
      cards: Array<{
        cardId: string;
        position: TarotPositionId;
        reversed: boolean;
      }>;
    };
    result?: TarotReadingResult;
  };
};

type ApiError = {
  readonly code: string;
  readonly message: string;
};

const CARD_IDS = new Set<string>(MAJOR_ARCANA.map((card) => card.id));

const READING_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  403: "필수 동의를 완료한 뒤 다시 리딩을 생성해 주세요.",
  409: "같은 요청이 처리 중이거나 입력이 변경됐어요. 잠시 뒤 다시 확인해 주세요.",
  502: "리딩 생성에 실패했어요. 잠시 뒤 다시 시도해 주세요.",
};

export function TarotExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("consent");
  const [spreadType, setSpreadType] = useState<TarotSpreadType>("daily_one_card");
  const [question, setQuestion] = useState("");
  const [choiceOptions, setChoiceOptions] = useState<TarotChoiceOptions>({ a: "", b: "" });
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inFlightRequestId = useRef<string | null>(null);

  const definition = TAROT_SPREADS[spreadType];
  const inputIsValid = hasValidTarotInput(spreadType, question, choiceOptions);

  const redirectToLogin = useCallback(() => {
    router.push("/login?next=%2Ftarot");
  }, [router]);

  function selectSpread(nextSpreadType: TarotSpreadType) {
    setSpreadType(nextSpreadType);
    setQuestion("");
    setChoiceOptions({ a: "", b: "" });
    setSelectedSlots([]);
    setRequestId(null);
    setError(null);
  }

  function beginDraw() {
    if (!inputIsValid) return;
    setSelectedSlots([]);
    setRequestId(null);
    setError(null);
    setPhase("draw");
  }

  function submitSelection(slot: number, positionIndex: number) {
    if (
      phase !== "draw"
      || slot < 1
      || slot > SLOT_COUNT
    ) return;
    setSelectedSlots((current) => {
      if (
        current.length !== positionIndex
        || current.length >= definition.cardCount
      ) return current;
      const next = [...current, slot];
      if (next.length === definition.cardCount) setPhase("confirm");
      return next;
    });
  }

  function handleSlotKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    slot: number,
    positionIndex: number,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    submitSelection(slot, positionIndex);
  }

  function resetForNewDraw() {
    setSpreadType("daily_one_card");
    setQuestion("");
    setChoiceOptions({ a: "", b: "" });
    setSelectedSlots([]);
    setRequestId(null);
    setError(null);
    setPhase("spread");
    router.push("/tarot");
  }

  const submitReading = useCallback(async () => {
    if (selectedSlots.length !== definition.cardCount || inFlightRequestId.current) return;
    const nextRequestId = requestId ?? globalThis.crypto.randomUUID();
    let body;
    try {
      body = createTarotReadingRequest({
        spreadType,
        question,
        choiceOptions,
        requestId: nextRequestId,
        selectedSlots,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "입력을 확인해 주세요.");
      setPhase("error");
      return;
    }

    inFlightRequestId.current = nextRequestId;
    setRequestId(nextRequestId);
    setError(null);
    setPhase("loading");

    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        redirectToLogin();
        setPhase("confirm");
        return;
      }
      if (!response.ok) {
        const apiError = await readApiError(response);
        setError(
          READING_ERROR_MESSAGES[response.status]
          ?? apiError.message
          ?? "리딩 요청을 처리하지 못했어요.",
        );
        setPhase("error");
        return;
      }

      const validated = validateReadingResponse(
        await response.json() as TarotReadingResponse,
        spreadType,
      );
      setRequestId(null);
      router.push(`/tarot/results/${encodeURIComponent(validated.readingId)}`);
    } catch (readingError) {
      setError(
        readingError instanceof Error && readingError.message.startsWith("리딩 결과")
          ? readingError.message
          : "리딩 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
      setPhase("error");
    } finally {
      inFlightRequestId.current = null;
    }
  }, [choiceOptions, definition.cardCount, question, redirectToLogin, requestId, router, selectedSlots, spreadType]);

  const handleConsentComplete = useCallback(() => {
    setPhase("spread");
  }, []);

  if (phase === "spread") {
    return (
      <ReadingShell eyebrow="AI TAROT" title="어떤 마음을 들여다볼까요?" step={1} totalSteps={4}>
        <ul className="spread-grid">
          {TAROT_SPREAD_LIST.map((spread) => (
            <li key={spread.id}>
              <button
                aria-pressed={spread.id === spreadType}
                className={spread.id === spreadType ? "spread-option active" : "spread-option"}
                onClick={() => selectSpread(spread.id)}
                type="button"
              >
                <strong>{spread.name}</strong>
                <span>{spread.summary}</span>
                <small>{spread.metaLabel}</small>
              </button>
            </li>
          ))}
        </ul>
        <button className="primary-button full-button narrow-button" onClick={() => setPhase("input")} type="button">
          이 유형으로 시작
        </button>
      </ReadingShell>
    );
  }

  if (phase === "input") {
    return (
      <ReadingShell
        eyebrow={definition.name}
        title={definition.inputMode === "fixed" ? "오늘의 메시지를 만나볼까요?" : "상황을 들려주세요"}
        description="입력 내용과 카드 선택은 리딩 요청 전까지 이 브라우저의 현재 화면에서만 유지됩니다."
        step={2}
        totalSteps={4}
      >
        <div className="wizard-card">
          {definition.inputMode === "fixed" ? (
            <p className="notice">{DAILY_QUESTION}</p>
          ) : (
            <label className="field">
              <span>카드에게 묻고 싶은 질문</span>
              <textarea
                aria-label="카드에게 묻고 싶은 질문"
                maxLength={MAX_QUESTION_LENGTH}
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="지금 들여다보고 싶은 상황을 적어주세요."
              />
              <small>{question.length} / {MAX_QUESTION_LENGTH}</small>
            </label>
          )}
          {definition.inputMode === "choice" ? (
            <div className="choice-fields">
              <label className="field">
                <span>선택 A</span>
                <input
                  aria-label="선택 A"
                  maxLength={MAX_CHOICE_LENGTH}
                  value={choiceOptions.a}
                  onChange={(event) => setChoiceOptions((current) => ({ ...current, a: event.target.value }))}
                />
                <small>{choiceOptions.a.length} / {MAX_CHOICE_LENGTH}</small>
              </label>
              <label className="field">
                <span>선택 B</span>
                <input
                  aria-label="선택 B"
                  maxLength={MAX_CHOICE_LENGTH}
                  value={choiceOptions.b}
                  onChange={(event) => setChoiceOptions((current) => ({ ...current, b: event.target.value }))}
                />
                <small>{choiceOptions.b.length} / {MAX_CHOICE_LENGTH}</small>
              </label>
              {choiceOptions.a.trim() && choiceOptions.a.trim() === choiceOptions.b.trim() ? (
                <p className="form-error" role="alert">선택 A와 B를 서로 다르게 적어주세요.</p>
              ) : null}
            </div>
          ) : null}
          <button
            className="primary-button full-button"
            disabled={!inputIsValid}
            onClick={beginDraw}
            type="button"
          >
            카드 고르러 가기
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "draw" && selectedSlots.length < definition.cardCount) {
    return (
      <DrawScreen
        definition={definition}
        selectedCount={selectedSlots.length}
        onReset={resetForNewDraw}
        onSelect={(slot) => submitSelection(slot, selectedSlots.length)}
        onKeyDown={handleSlotKeyDown}
      />
    );
  }

  if (phase === "confirm" && selectedSlots.length === definition.cardCount) {
    return (
      <ReadingShell eyebrow={definition.name} title="카드 선택을 마쳤어요" step={4} totalSteps={4}>
        <div className="wizard-card confirmation-card">
          <div className="draw-complete-grid">
            {definition.positions.map((position) => (
              <article className="revealed-card" key={position.id}>
                <span>{position.label}</span>
                <span aria-label={`${position.label} 선택 완료 카드 뒷면`} className="confirmed-card-back" role="img">
                  <i aria-hidden="true">✦</i>
                </span>
              </article>
            ))}
          </div>
          <p className="notice">선택한 카드는 리딩 결과에서 처음 공개됩니다.</p>
          <div className="result-actions">
            <button className="primary-button" disabled={!inputIsValid} onClick={() => void submitReading()} type="button">
              리딩 생성
            </button>
            <button className="secondary-button" onClick={resetForNewDraw} type="button">
              새 선택 시작
            </button>
          </div>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "consent") {
    return (
      <ReadingShell eyebrow={definition.name} title="리딩 전 필수 동의를 확인해요" step={1} totalSteps={4}>
        <ConsentGate onComplete={handleConsentComplete} onUnauthenticated={redirectToLogin} />
      </ReadingShell>
    );
  }

  if (phase === "loading") {
    return (
      <ReadingShell eyebrow={definition.name} title="선택한 카드의 흐름을 읽고 있어요" step={4} totalSteps={4}>
        <div className="wizard-card loading-card" aria-live="polite">
          <p>선택한 카드와 질문을 연결하고 있어요. 잠시만 기다려 주세요.</p>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "error") {
    return (
      <ReadingShell eyebrow={definition.name} title="리딩을 이어가지 못했어요" step={4} totalSteps={4}>
        <div className="wizard-card" role="alert">
          <p>{error}</p>
          <button className="secondary-button full-button" onClick={() => void submitReading()} type="button">
            같은 선택으로 다시 시도
          </button>
        </div>
      </ReadingShell>
    );
  }

  return null;
}

function DrawScreen({
  definition,
  selectedCount,
  onReset,
  onSelect,
  onKeyDown,
}: {
  definition: (typeof TAROT_SPREADS)[TarotSpreadType];
  selectedCount: number;
  onReset: () => void;
  onSelect: (slot: number) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    slot: number,
    positionIndex: number,
  ) => void;
}) {
  const currentPosition = definition.positions[selectedCount];
  return (
    <ReadingShell eyebrow={definition.name} title={currentPosition.label} step={3} totalSteps={4}>
      <div className="wizard-card draw-panel">
        <p className="draw-progress" aria-live="polite">{selectedCount + 1} / {definition.cardCount}</p>
        {selectedCount > 0 ? (
          <ol className="confirmed-draw-slots" aria-label="확정된 위치">
            {definition.positions.slice(0, selectedCount).map((position) => (
              <li key={position.id}>
                <span>{position.label}</span>
                <span aria-label={`${position.label} 선택 완료 카드 뒷면`} className="confirmed-card-back" role="img">
                  <i aria-hidden="true">✦</i>
                </span>
              </li>
            ))}
          </ol>
        ) : null}
        <p className="draw-instruction">{currentPosition.instruction}</p>
        <div className="tarot-candidates" aria-label={`${currentPosition.label} 카드 선택`}>
          {Array.from({ length: SLOT_COUNT }, (_, index) => index + 1).map((slot) => (
            <button
              aria-label={`숨은 카드 ${slot}`}
              className="tarot-back"
              key={`${selectedCount}-${slot}`}
              onClick={() => onSelect(slot)}
              onKeyDown={(event) => onKeyDown(event, slot, selectedCount)}
              type="button"
            >
              <span aria-hidden="true">✦</span>
            </button>
          ))}
        </div>
        <button className="secondary-button full-button narrow-button" onClick={onReset} type="button">
          처음부터 다시 선택
        </button>
      </div>
    </ReadingShell>
  );
}

function validateReadingResponse(
  payload: TarotReadingResponse,
  spreadType: TarotSpreadType,
): { readingId: string } {
  const reading = payload.reading;
  const definition = TAROT_SPREADS[spreadType];
  if (
    !reading
    || typeof reading.id !== "string"
    || reading.id.length < 1
    || reading.spreadType !== spreadType
    || reading.schemaVersion !== 1
    || !reading.result
    || !Array.isArray(reading.input?.cards)
    || reading.input.cards.length !== definition.cardCount
  ) {
    throw new Error("리딩 결과 계약이 선택한 유형과 일치하지 않습니다.");
  }

  const declinedView = parseDeclinedReadingView(reading, "tarot");
  const isDeclinedResult = (reading.result as { resultType?: unknown }).resultType === "declined";
  if (isDeclinedResult && !declinedView) {
    throw new Error("리딩 결과 계약이 선택한 유형과 일치하지 않습니다.");
  }
  if (!declinedView && reading.result.sections?.length !== definition.cardCount) {
    throw new Error("리딩 결과 계약이 선택한 유형과 일치하지 않습니다.");
  }

  const seenCardIds = new Set<string>();
  for (let index = 0; index < definition.cardCount; index += 1) {
    const position = definition.positions[index].id;
    const inputCard = reading.input.cards[index];
    if (
      inputCard?.position !== position
      || !CARD_IDS.has(inputCard.cardId)
      || inputCard.reversed !== false
      || seenCardIds.has(inputCard.cardId)
      || (!declinedView && reading.result.sections[index]?.position !== position)
    ) {
      throw new Error("리딩 결과의 카드와 해석 위치가 일치하지 않습니다.");
    }
    seenCardIds.add(inputCard.cardId);
  }
  return { readingId: reading.id };
}

async function readApiError(response: Response): Promise<ApiError> {
  try {
    const payload = await response.json() as Partial<ApiError>;
    return {
      code: typeof payload.code === "string" ? payload.code : "UNKNOWN_ERROR",
      message: typeof payload.message === "string" ? payload.message : "",
    };
  } catch {
    return { code: "UNKNOWN_ERROR", message: "" };
  }
}

function hasValidTarotInput(
  spreadType: TarotSpreadType,
  question: string,
  choiceOptions: TarotChoiceOptions,
): boolean {
  const definition = TAROT_SPREADS[spreadType];
  if (definition.inputMode === "fixed") return true;
  const normalizedQuestion = question.trim();
  if (normalizedQuestion.length < 1 || question.length > MAX_QUESTION_LENGTH) return false;
  if (definition.inputMode !== "choice") return true;
  const optionA = choiceOptions.a.trim();
  const optionB = choiceOptions.b.trim();
  return optionA.length >= 1
    && optionB.length >= 1
    && choiceOptions.a.length <= MAX_CHOICE_LENGTH
    && choiceOptions.b.length <= MAX_CHOICE_LENGTH
    && optionA !== optionB;
}
