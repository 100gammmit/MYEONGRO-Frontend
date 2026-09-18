"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import {
  MAJOR_ARCANA,
  TAROT_SPREAD_LIST,
  TAROT_SPREADS,
  createTarotReadingRequest,
  isAiTarotSpreadType,
  type TarotChoiceOptions,
  type TarotPositionId,
  type TarotSpreadType,
} from "@/domain/tarot";
import { parseDeclinedReadingView } from "@/domain/reading/declined-result";
import {
  containsDirectIdentifier,
  DIRECT_IDENTIFIER_INPUT_MESSAGE,
} from "@/domain/reading/direct-identifier";
import { getReadingCreditAccess } from "@/domain/reading-credit";
import { ConsentGate } from "./consent-gate";
import { stoneForSlot, TarotStone } from "./tarot-stone";
import { ReadingCreditAccessNotice } from "./reading-credit-access-notice";
import { useReadingCredits } from "./reading-credit-provider";
import { ReadingLoading, type ReadingLoadingMessages } from "./reading-loading";
import { ReadingShell } from "./reading-shell";
import styles from "./tarot-experience.module.css";

const MAX_QUESTION_LENGTH = 300;
const MAX_CHOICE_LENGTH = 100;
const SLOT_COUNT = 5;

// One message per stroke of the brand mark, as on the saju wait.
const LOADING_MESSAGES: ReadingLoadingMessages = [
  "선택한 카드를 확인하고 있어요.",
  "카드마다 자리의 의미를 살피고 있어요.",
  "카드 사이의 흐름을 잇고 있어요.",
  "질문에 맞는 리딩을 구성하고 있어요.",
];

type Phase = "spread" | "input" | "draw" | "consent" | "loading" | "error";

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
  readonly field: string | null;
  readonly message: string;
  readonly readingId: string | null;
};

type EditableInputField = "question" | "choiceOptions.a" | "choiceOptions.b";

const EDITABLE_INPUT_CODES = new Set(["DIRECT_IDENTIFIER_NOT_ALLOWED"]);

const CARD_IDS = new Set<string>(MAJOR_ARCANA.map((card) => card.id));

const READING_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  403: "필수 동의를 완료한 뒤 다시 리딩을 생성해 주세요.",
  409: "요청 상태가 바뀌었어요. 입력 내용을 확인한 뒤 다시 시도해 주세요.",
  502: "리딩 생성에 실패했어요. 잠시 뒤 다시 시도해 주세요.",
};

export function TarotExperience() {
  const router = useRouter();
  const credits = useReadingCredits();
  const [phase, setPhase] = useState<Phase>("spread");
  const [spreadType, setSpreadType] = useState<TarotSpreadType>("daily_one_card");
  const [question, setQuestion] = useState("");
  const [choiceOptions, setChoiceOptions] = useState<TarotChoiceOptions>({ a: "", b: "" });
  const [selectedSlots, setSelectedSlots] = useState<number[]>([]);
  const [focusedSlot, setFocusedSlot] = useState<number | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputErrorField, setInputErrorField] = useState<EditableInputField | null>(null);
  const inFlightRequestId = useRef<string | null>(null);
  const questionInputRef = useRef<HTMLTextAreaElement>(null);
  const choiceAInputRef = useRef<HTMLInputElement>(null);
  const choiceBInputRef = useRef<HTMLInputElement>(null);

  const definition = TAROT_SPREADS[spreadType];
  const inputIsValid = hasValidTarotInput(spreadType, question, choiceOptions);
  const creditData = credits.state.status === "ready" ? credits.state.data : null;
  const isAiSpread = isAiTarotSpreadType(spreadType);
  const creditCost = isAiSpread ? creditData?.costs.tarot[spreadType] ?? null : 0;
  const creditAccess = isAiSpread
    ? credits.state.status === "idle"
      ? { status: "allowed", required: 0, remaining: 0 } as const
      : getReadingCreditAccess(
      creditData,
      credits.state.status === "loading",
      creditCost,
      )
    : { status: "allowed", required: 0, remaining: creditData?.balance.total ?? 0 } as const;

  const redirectToLogin = useCallback(() => {
    router.push("/login?next=%2Ftarot");
  }, [router]);

  function selectSpread(nextSpreadType: TarotSpreadType) {
    setSpreadType(nextSpreadType);
    setQuestion("");
    setChoiceOptions({ a: "", b: "" });
    setSelectedSlots([]);
    setFocusedSlot(null);
    setRequestId(null);
    setError(null);
    setInputErrorField(null);
  }

  function beginDraw() {
    if (!inputIsValid || creditAccess.status !== "allowed") return;
    const blockedField = directIdentifierField(question, choiceOptions, definition.inputMode);
    if (blockedField) {
      setError(DIRECT_IDENTIFIER_INPUT_MESSAGE);
      setInputErrorField(blockedField);
      return;
    }
    setSelectedSlots([]);
    setFocusedSlot(null);
    setRequestId(null);
    setError(null);
    setInputErrorField(null);
    setPhase("draw");
  }

  function beginSelectedSpread() {
    if (spreadType === "daily_one_card") {
      router.push("/tarot/daily");
      return;
    }
    if (creditAccess.status !== "allowed") return;
    setPhase("consent");
  }

  function focusSelection(slot: number) {
    if (phase !== "draw" || slot < 1 || slot > SLOT_COUNT) return;
    setFocusedSlot(slot);
  }

  function handleSlotKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    slot: number,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    focusSelection(slot);
  }

  const submitReading = useCallback(async (slots: readonly number[] = selectedSlots) => {
    if (!isAiTarotSpreadType(spreadType)
      || slots.length !== definition.cardCount
      || inFlightRequestId.current) return;
    const nextRequestId = requestId ?? globalThis.crypto.randomUUID();
    let body;
    try {
      body = createTarotReadingRequest({
        spreadType,
        question,
        choiceOptions,
        requestId: nextRequestId,
        selectedSlots: slots,
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
      const response = await fetch("/api/tarot/readings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 401) {
        redirectToLogin();
        setSelectedSlots(slots.slice(0, -1));
        setFocusedSlot(slots.at(-1) ?? null);
        setPhase("draw");
        return;
      }
      if (!response.ok) {
        const apiError = await readApiError(response);
        if (isEditableInputError(apiError)) {
          setError(apiError.message || "입력 내용을 확인해 주세요.");
          setInputErrorField(apiError.field);
          setRequestId(null);
          setPhase("input");
          return;
        }
        if (
          apiError.code === "READING_GENERATION_IN_PROGRESS"
          || apiError.code === "INSUFFICIENT_READING_CREDITS"
        ) {
          void credits.refresh();
        }
        if (apiError.code === "OPENAI_READING_GENERATION_FAILED") {
          setRequestId(null);
        }
        setError(
          readingErrorMessage(response.status, apiError)
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
      void credits.refresh();
      router.push(`/tarot/results/${encodeURIComponent(validated.readingId)}`);
    } catch (readingError) {
      setError(
        readingError instanceof Error && readingError.message.startsWith("리딩 결과")
          ? "리딩 결과를 확인하는 중 문제가 생겼어요. 같은 질문으로 다시 시도해 주세요."
          : "리딩 서버에 연결하지 못했어요. 잠시 뒤 다시 시도해 주세요.",
      );
      setPhase("error");
    } finally {
      inFlightRequestId.current = null;
    }
  }, [choiceOptions, credits, definition.cardCount, question, redirectToLogin, requestId, router, selectedSlots, spreadType]);

  function confirmSelection() {
    if (focusedSlot === null || selectedSlots.length >= definition.cardCount) return;
    const nextSelectedSlots = [...selectedSlots, focusedSlot];
    setSelectedSlots(nextSelectedSlots);
    if (nextSelectedSlots.length === definition.cardCount) {
      void submitReading(nextSelectedSlots);
      return;
    }
    setFocusedSlot(null);
  }

  const handleConsentComplete = useCallback(() => {
    setPhase("input");
  }, []);

  useEffect(() => {
    if (phase !== "input" || inputErrorField === null) return;
    const target = inputErrorField === "question"
      ? questionInputRef.current
      : inputErrorField === "choiceOptions.a"
        ? choiceAInputRef.current
        : choiceBInputRef.current;
    target?.focus();
  }, [inputErrorField, phase]);

  function clearInputError(field: EditableInputField) {
    if (inputErrorField !== field) return;
    setInputErrorField(null);
    setError(null);
  }

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
                <small>
                  {spread.metaLabel} · {spread.id === "daily_one_card"
                    ? "무료"
                    : `${creditData?.costs.tarot[spread.id] ?? "…"} 크레딧`}
                </small>
              </button>
            </li>
          ))}
        </ul>
        {isAiSpread ? (
          <ReadingCreditAccessNotice access={creditAccess} onRetry={() => void credits.refresh()} />
        ) : null}
        <button
          className="primary-button full-button narrow-button"
          disabled={creditAccess.status !== "allowed"}
          onClick={beginSelectedSpread}
          type="button"
        >
          이 유형으로 시작
        </button>
      </ReadingShell>
    );
  }

  if (phase === "input") {
    return (
      <ReadingShell
        eyebrow={definition.name}
        title="상황을 들려주세요"
        description="입력한 내용과 카드 선택은 리딩을 요청하기 전까지 저장되지 않아요."
        step={2}
        totalSteps={4}
      >
        <div className="wizard-card">
          <label className="field">
            <span>카드에게 묻고 싶은 질문</span>
            <textarea
              aria-describedby={inputErrorField === "question"
                ? "tarot-question-guidance tarot-input-error"
                : "tarot-question-guidance"}
              aria-invalid={inputErrorField === "question"}
              aria-label="카드에게 묻고 싶은 질문"
              maxLength={MAX_QUESTION_LENGTH}
              ref={questionInputRef}
              value={question}
              onChange={(event) => {
                setQuestion(event.target.value);
                clearInputError("question");
              }}
              placeholder="지금 들여다보고 싶은 상황을 적어주세요."
            />
            <p className="field-guidance" id="tarot-question-guidance">
              개인정보는 제외하고 상황만 작성해 주세요. 이름·이메일·전화번호·주소·주민등록번호·계좌나 카드번호와 진단·복약, 성생활, 정치·종교 신념 등 개인을 알아보거나 민감할 수 있는 내용은 입력하지 마세요. 작성한 질문과 선택지는 AI 리딩 생성을 위해 OpenAI API로 전송되지만 명로의 리딩 기록에는 저장되지 않습니다. 자동 검사는 일부 식별정보 형식만 확인하므로 전송하기 전에 불필요한 개인정보가 없는지 직접 확인해 주세요.
              {spreadType === "relationship_three_card"
                ? " 상대방의 실명 대신 친구·연인·직장 동료처럼 관계로 적어주세요."
                : null}
            </p>
            <small>{question.length} / {MAX_QUESTION_LENGTH}</small>
          </label>
          {definition.inputMode === "choice" ? (
            <div className="choice-fields">
              <label className="field">
                <span>선택 A</span>
                <input
                  aria-describedby={inputErrorField === "choiceOptions.a"
                    ? "tarot-question-guidance tarot-input-error"
                    : "tarot-question-guidance"}
                  aria-invalid={inputErrorField === "choiceOptions.a"}
                  aria-label="선택 A"
                  maxLength={MAX_CHOICE_LENGTH}
                  ref={choiceAInputRef}
                  value={choiceOptions.a}
                  onChange={(event) => {
                    setChoiceOptions((current) => ({ ...current, a: event.target.value }));
                    clearInputError("choiceOptions.a");
                  }}
                />
                <small>{choiceOptions.a.length} / {MAX_CHOICE_LENGTH}</small>
              </label>
              <label className="field">
                <span>선택 B</span>
                <input
                  aria-describedby={inputErrorField === "choiceOptions.b"
                    ? "tarot-question-guidance tarot-input-error"
                    : "tarot-question-guidance"}
                  aria-invalid={inputErrorField === "choiceOptions.b"}
                  aria-label="선택 B"
                  maxLength={MAX_CHOICE_LENGTH}
                  ref={choiceBInputRef}
                  value={choiceOptions.b}
                  onChange={(event) => {
                    setChoiceOptions((current) => ({ ...current, b: event.target.value }));
                    clearInputError("choiceOptions.b");
                  }}
                />
                <small>{choiceOptions.b.length} / {MAX_CHOICE_LENGTH}</small>
              </label>
              {choiceOptions.a.trim() && choiceOptions.a.trim() === choiceOptions.b.trim() ? (
                <p className="form-error" role="alert">선택 A와 B를 서로 다르게 적어주세요.</p>
              ) : null}
            </div>
          ) : null}
          {inputErrorField && error ? (
            <p className="form-error" id="tarot-input-error" role="alert">{error}</p>
          ) : null}
          <button
            className="primary-button full-button"
            disabled={!inputIsValid || creditAccess.status !== "allowed"}
            onClick={beginDraw}
            type="button"
          >
            카드 고르러 가기
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "draw") {
    return (
      <DrawScreen
        definition={definition}
        focusedSlot={focusedSlot}
        selectedSlots={selectedSlots}
        onConfirm={confirmSelection}
        onSelect={focusSelection}
        onKeyDown={handleSlotKeyDown}
      />
    );
  }

  if (phase === "consent") {
    return (
      <ReadingShell eyebrow={definition.name} title="리딩 전 필수 동의를 확인해요" stepLabel="시작하기 전에">
        <ConsentGate
          scope="tarot"
          onComplete={handleConsentComplete}
          onUnauthenticated={redirectToLogin}
        />
      </ReadingShell>
    );
  }

  if (phase === "loading") {
    return (
      <ReadingShell
        eyebrow={definition.name}
        form
        title="선택한 카드의 흐름을 읽고 있어요"
        step={4}
        totalSteps={4}
        showHomeLink={false}
      >
        <ReadingLoading messages={LOADING_MESSAGES} />
      </ReadingShell>
    );
  }

  if (phase === "error") {
    return (
      <ReadingShell eyebrow={definition.name} title="리딩을 이어가지 못했어요" step={4} totalSteps={4}>
        <div className="wizard-card" role="alert">
          <p>{error}</p>
          <button
            className="secondary-button full-button"
            disabled={creditAccess.status !== "allowed"}
            onClick={() => void submitReading()}
            type="button"
          >
            같은 질문으로 다시 시도
          </button>
          <ReadingCreditAccessNotice access={creditAccess} onRetry={() => void credits.refresh()} />
        </div>
      </ReadingShell>
    );
  }

  return null;
}

function readingErrorMessage(status: number, error: ApiError): string | undefined {
  if (error.code === "READING_GENERATION_IN_PROGRESS") {
    return "이미 생성 중인 리딩이 있어요. 완료 후 다시 시도해 주세요.";
  }
  if (error.code === "INSUFFICIENT_READING_CREDITS") {
    return "크레딧이 부족해요. 크레딧은 내일 0시에 다시 채워지니, 내일 다시 시도해 주세요.";
  }
  return READING_ERROR_MESSAGES[status];
}

function DrawScreen({
  definition,
  focusedSlot,
  selectedSlots,
  onConfirm,
  onSelect,
  onKeyDown,
}: {
  definition: (typeof TAROT_SPREADS)[TarotSpreadType];
  focusedSlot: number | null;
  selectedSlots: readonly number[];
  onConfirm: () => void;
  onSelect: (slot: number) => void;
  onKeyDown: (
    event: KeyboardEvent<HTMLButtonElement>,
    slot: number,
  ) => void;
}) {
  const selectedCount = selectedSlots.length;
  const isLastPosition = selectedCount === definition.cardCount - 1;
  const currentPosition = definition.positions[selectedCount];
  const firstCardRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (selectedCount > 0 && focusedSlot === null) {
      firstCardRef.current?.focus();
    }
  }, [focusedSlot, selectedCount]);

  return (
    <ReadingShell eyebrow={definition.name} title={currentPosition.label} step={3} totalSteps={4}>
      <div className="wizard-card draw-panel">
        <p className="draw-progress" aria-live="polite">
          {selectedCount + 1} / {definition.cardCount}
        </p>
        <p className="draw-instruction">{currentPosition.instruction}</p>
        <div className="tarot-candidates" aria-label={`${currentPosition.label} 카드 선택`}>
          {Array.from({ length: SLOT_COUNT }, (_, index) => index + 1).map((slot) => (
            <button
              aria-label={`숨은 카드 ${slot}`}
              aria-pressed={slot === focusedSlot}
              className={slot === focusedSlot
                ? `tarot-back ${styles.selectedCard}`
                : "tarot-back"}
              key={slot}
              onClick={() => onSelect(slot)}
              onKeyDown={(event) => onKeyDown(event, slot)}
              ref={slot === 1 ? firstCardRef : undefined}
              type="button"
            >
              <TarotStone kind={stoneForSlot(slot)} />
            </button>
          ))}
        </div>
        <button
          className="primary-button full-button narrow-button"
          disabled={focusedSlot === null}
          onClick={onConfirm}
          type="button"
        >
          {isLastPosition ? "리딩 생성" : "다음 카드 고르러 가기"}
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
    || reading.schemaVersion !== 2
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
      field: typeof payload.field === "string" ? payload.field : null,
      message: typeof payload.message === "string" ? payload.message : "",
      readingId: typeof payload.readingId === "string" && payload.readingId.length > 0
        ? payload.readingId
        : null,
    };
  } catch {
    return { code: "UNKNOWN_ERROR", field: null, message: "", readingId: null };
  }
}

function isEditableInputError(
  error: ApiError,
): error is ApiError & { field: EditableInputField } {
  return EDITABLE_INPUT_CODES.has(error.code)
    && (error.field === "question"
      || error.field === "choiceOptions.a"
      || error.field === "choiceOptions.b");
}

function directIdentifierField(
  question: string,
  choiceOptions: TarotChoiceOptions,
  inputMode: "fixed" | "question" | "choice",
): EditableInputField | null {
  if (containsDirectIdentifier(question)) return "question";
  if (inputMode !== "choice") return null;
  if (containsDirectIdentifier(choiceOptions.a)) return "choiceOptions.a";
  if (containsDirectIdentifier(choiceOptions.b)) return "choiceOptions.b";
  return null;
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
