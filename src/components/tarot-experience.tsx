"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";

import {
  DAILY_QUESTION,
  MAJOR_ARCANA,
  TAROT_SPREAD_LIST,
  TAROT_SPREADS,
  createTarotReadingRequest,
  parseTarotDrawSessionState,
  type TarotChoiceOptions,
  type TarotDrawComplete,
  type TarotDrawError,
  type TarotDrawInProgress,
  type TarotDrawSessionState,
  type TarotPositionId,
  type TarotSpreadType,
} from "@/domain/tarot";
import { ConsentGate } from "./consent-gate";
import { ReadingShell } from "./reading-shell";

const MAX_QUESTION_LENGTH = 300;
const MAX_CHOICE_LENGTH = 100;
const LEGACY_DRAFT_STORAGE_KEY = "myeongro:tarot-draft";
const PREVIOUS_DRAFT_STORAGE_KEY = "myeongro:tarot-draw-draft-v2";
const DRAFT_STORAGE_KEY = "myeongro:tarot-draw-draft-v3";

type Phase =
  | "auth"
  | "spread"
  | "input"
  | "draw"
  | "active-choice"
  | "abandon-confirm"
  | "confirm"
  | "consent"
  | "loading"
  | "result"
  | "error";

type RetryMode = "auth" | "active" | "start" | "reading" | "consumed" | null;

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

type TarotDraft = {
  version: 3;
  spreadType: TarotSpreadType;
  question: string;
  choiceOptions: TarotChoiceOptions;
  drawSessionId?: string;
  requestId?: string;
};

const CARD_INDEX = new Map<string, (typeof MAJOR_ARCANA)[number]>(
  MAJOR_ARCANA.map((card) => [card.id, card]),
);

const READING_ERROR_MESSAGES: Readonly<Record<number, string>> = {
  403: "필수 동의를 완료한 뒤 다시 리딩을 생성해 주세요.",
  409: "같은 요청을 처리하고 있어요. 잠시 후 다시 확인해 주세요.",
  429: "오늘의 무료 리딩 이용 한도에 도달했어요.",
  502: "리딩 생성에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

export function TarotExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("auth");
  const [spreadType, setSpreadType] = useState<TarotSpreadType>("daily_one_card");
  const [question, setQuestion] = useState("");
  const [choiceOptions, setChoiceOptions] = useState<TarotChoiceOptions>({ a: "", b: "" });
  const [drawState, setDrawState] = useState<TarotDrawSessionState | null>(null);
  const [isSelectionPending, setIsSelectionPending] = useState(false);
  const [isOperationPending, setIsOperationPending] = useState(false);
  const [isRecoveringInput, setIsRecoveringInput] = useState(false);
  const [readingRecoveryDrawSessionId, setReadingRecoveryDrawSessionId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<TarotReadingResult | null>(null);
  const [resultCards, setResultCards] = useState<string[]>([]);
  const [revealedResultCount, setRevealedResultCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [retryMode, setRetryMode] = useState<RetryMode>(null);
  const selectionInFlight = useRef(false);
  const operationInFlight = useRef(false);
  const inFlightRequestId = useRef<string | null>(null);
  const bootstrapStarted = useRef(false);

  const definition = TAROT_SPREADS[spreadType];
  const inputIsValid = hasValidTarotInput(spreadType, question, choiceOptions);

  const persistDraft = useCallback((drawSessionId?: string, persistedRequestId = requestId ?? undefined) => {
    writeDraft({
      version: 3,
      spreadType,
      question,
      choiceOptions,
      ...(drawSessionId ? { drawSessionId } : {}),
      ...(persistedRequestId ? { requestId: persistedRequestId } : {}),
    });
  }, [choiceOptions, question, requestId, spreadType]);

  const redirectToLogin = useCallback((drawSessionId?: string, persistedRequestId?: string) => {
    persistDraft(drawSessionId, persistedRequestId);
    router.push("/login?next=%2Ftarot");
  }, [persistDraft, router]);

  const showError = useCallback((message: string, mode: RetryMode) => {
    setError(message);
    setRetryMode(mode);
    setPhase("error");
  }, []);

  const adoptDrawState = useCallback((
    state: TarotDrawSessionState,
    options?: { offerChoice?: boolean; draft?: TarotDraft | null },
  ) => {
    const draft = options?.draft;
    const draftMatchesSession = draft?.spreadType === state.spreadType
      && draft.drawSessionId === state.drawSessionId;
    const sameCurrentSession = drawState?.drawSessionId === state.drawSessionId;
    const restoredQuestion = draftMatchesSession
      ? draft.question
      : sameCurrentSession
        ? question
        : "";
    const restoredChoices = draftMatchesSession
      ? draft.choiceOptions
      : sameCurrentSession
        ? choiceOptions
        : { a: "", b: "" };
    const restoredRequestId = draftMatchesSession
      ? draft.requestId ?? null
      : sameCurrentSession
        ? requestId
        : null;
    const needsInputRecovery = !hasValidTarotInput(
      state.spreadType,
      restoredQuestion,
      restoredChoices,
    );
    setSpreadType(state.spreadType);
    setQuestion(restoredQuestion);
    setChoiceOptions(restoredChoices);
    setRequestId(restoredRequestId);
    setIsRecoveringInput(needsInputRecovery);
    setReadingRecoveryDrawSessionId(null);
    setDrawState(state);
    setError(null);
    setRetryMode(null);
    writeDraft({
      version: 3,
      spreadType: state.spreadType,
      question: restoredQuestion,
      choiceOptions: restoredChoices,
      drawSessionId: state.drawSessionId,
      ...(restoredRequestId ? { requestId: restoredRequestId } : {}),
    });
    if (options?.offerChoice) {
      setPhase("active-choice");
      return;
    }
    if (needsInputRecovery) {
      setPhase("input");
      return;
    }
    setPhase(state.status === "complete" ? "confirm" : "draw");
  }, [choiceOptions, drawState?.drawSessionId, question, requestId]);

  const loadActiveSession = useCallback(async (
    options?: { offerChoice?: boolean; draft?: TarotDraft | null },
  ) => {
    try {
      const response = await fetch("/api/tarot/draw-sessions/active", {
        credentials: "same-origin",
      });
      if (response.status === 401) {
        redirectToLogin(drawState?.drawSessionId);
        return;
      }
      if (response.status === 404) {
        const apiError = await readApiError(response);
        if (apiError.code === "DRAW_SESSION_NOT_FOUND") {
          const recoveryDraft = options?.draft ?? readDraft();
          if (isRecoverableReadingDraft(recoveryDraft)) {
            setSpreadType(recoveryDraft.spreadType);
            setQuestion(recoveryDraft.question);
            setChoiceOptions(recoveryDraft.choiceOptions);
            setRequestId(recoveryDraft.requestId);
            setDrawState(null);
            setReadingRecoveryDrawSessionId(recoveryDraft.drawSessionId);
            setIsRecoveringInput(false);
            showError("이전 리딩 요청의 결과를 확인하지 못했어요. 같은 요청으로 다시 확인해 주세요.", "reading");
            return;
          }
          setDrawState(null);
          setReadingRecoveryDrawSessionId(null);
          setError(null);
          setRetryMode(null);
          setPhase("spread");
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
          return;
        }
      }
      if (!response.ok) {
        showError("서버 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.", "active");
        return;
      }
      const state = parseTarotDrawSessionState(await response.json());
      adoptDrawState(state, options);
    } catch {
      showError("서버 상태를 확인하지 못했어요. 잠시 후 다시 시도해 주세요.", "active");
    }
  }, [adoptDrawState, drawState?.drawSessionId, redirectToLogin, showError]);

  const authenticateAndRestore = useCallback(async () => {
    setPhase("auth");
    setError(null);
    setRetryMode(null);
    sessionStorage.removeItem(LEGACY_DRAFT_STORAGE_KEY);
    sessionStorage.removeItem(PREVIOUS_DRAFT_STORAGE_KEY);
    const draft = readDraft();
    if (draft) {
      setSpreadType(draft.spreadType);
      setQuestion(draft.question);
      setChoiceOptions(draft.choiceOptions);
      setRequestId(draft.requestId ?? null);
    }
    try {
      const response = await fetch("/api/me", { credentials: "same-origin" });
      if (!response.ok && response.status !== 401) {
        showError("로그인 상태를 확인하지 못했어요. 서버 연결 상태를 확인하고 다시 시도해 주세요.", "auth");
        return;
      }
      const payload = response.ok
        ? await response.json() as { authenticated?: boolean }
        : { authenticated: false };
      if (payload.authenticated !== true) {
        router.push("/login?next=%2Ftarot");
        return;
      }
      await loadActiveSession({ draft });
    } catch {
      showError("로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.", "auth");
    }
  }, [loadActiveSession, router, showError]);

  useEffect(() => {
    if (bootstrapStarted.current) return;
    bootstrapStarted.current = true;
    void authenticateAndRestore();
  }, [authenticateAndRestore]);

  function selectSpread(nextSpreadType: TarotSpreadType) {
    setSpreadType(nextSpreadType);
    setQuestion("");
    setChoiceOptions({ a: "", b: "" });
    setDrawState(null);
    setIsRecoveringInput(false);
    setReadingRecoveryDrawSessionId(null);
    setRequestId(null);
    setResult(null);
    setError(null);
    setRetryMode(null);
  }

  async function beginDraw() {
    if (!inputIsValid || operationInFlight.current) return;
    operationInFlight.current = true;
    setIsOperationPending(true);
    persistDraft();
    try {
      const response = await fetch("/api/tarot/draw-sessions", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spreadType }),
      });
      if (response.status === 401) {
        redirectToLogin();
        return;
      }
      if (!response.ok) {
        const apiError = await readApiError(response);
        if (response.status === 409 && apiError.code === "DRAW_SESSION_ACTIVE") {
          await loadActiveSession({ offerChoice: true });
          return;
        }
        if (response.status === 400 && apiError.code === "INVALID_SPREAD_TYPE") {
          setPhase("spread");
          return;
        }
        showError(apiError.message || "새 추첨을 시작하지 못했어요.", "start");
        return;
      }
      const state = parseTarotDrawSessionState(await response.json());
      adoptDrawState(state, {
        draft: {
          version: 3,
          spreadType,
          question,
          choiceOptions,
          drawSessionId: state.drawSessionId,
        },
      });
    } catch {
      showError("새 추첨을 시작하지 못했어요. 서버 연결 상태를 확인해 주세요.", "start");
    } finally {
      operationInFlight.current = false;
      setIsOperationPending(false);
    }
  }

  function resumeDrawAfterInput() {
    if (!inputIsValid || !drawState) return;
    persistDraft(drawState.drawSessionId);
    setIsRecoveringInput(false);
    setPhase(drawState.status === "complete" ? "confirm" : "draw");
  }

  function continueActiveDraw() {
    if (!drawState) return;
    setPhase(isRecoveringInput ? "input" : drawState.status === "complete" ? "confirm" : "draw");
  }

  async function submitSelection(candidateToken: string) {
    if (
      drawState?.status !== "in_progress"
      || selectionInFlight.current
    ) return;
    selectionInFlight.current = true;
    setIsSelectionPending(true);
    try {
      const response = await fetch(
        `/api/tarot/draw-sessions/${encodeURIComponent(drawState.drawSessionId)}/selections`,
        {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateToken }),
        },
      );
      if (response.status === 401) {
        redirectToLogin(drawState.drawSessionId);
        return;
      }
      if (!response.ok) {
        const apiError = await readApiError(response);
        if (response.status === 404 && apiError.code === "DRAW_SESSION_NOT_FOUND") {
          setDrawState(null);
          sessionStorage.removeItem(DRAFT_STORAGE_KEY);
          setPhase("spread");
          return;
        }
        if (response.status === 409 && apiError.code === "DRAW_SESSION_STATE_CONFLICT") {
          await loadActiveSession();
          return;
        }
        showError("서버 상태를 확인하지 못했어요. 선택 상태를 다시 확인해 주세요.", "active");
        return;
      }
      adoptDrawState(parseTarotDrawSessionState(await response.json()));
    } catch {
      showError("서버 상태를 확인하지 못했어요. 선택 상태를 다시 확인해 주세요.", "active");
    } finally {
      selectionInFlight.current = false;
      setIsSelectionPending(false);
    }
  }

  function handleCandidateKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    candidateToken: string,
  ) {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    void submitSelection(candidateToken);
  }

  async function abandonDraw() {
    if (!drawState || operationInFlight.current) return;
    operationInFlight.current = true;
    setIsOperationPending(true);
    try {
      const response = await fetch(
        `/api/tarot/draw-sessions/${encodeURIComponent(drawState.drawSessionId)}`,
        { method: "DELETE", credentials: "same-origin" },
      );
      if (response.status === 401) {
        redirectToLogin(drawState.drawSessionId);
        return;
      }
      if (response.status === 204 || response.status === 404) {
        resetForNewDraw();
        return;
      }
      showError("기존 추첨 상태를 정리하지 못했어요. 서버 상태를 다시 확인해 주세요.", "active");
    } catch {
      showError("기존 추첨 상태를 정리하지 못했어요. 서버 상태를 다시 확인해 주세요.", "active");
    } finally {
      operationInFlight.current = false;
      setIsOperationPending(false);
    }
  }

  function resetForNewDraw() {
    setDrawState(null);
    setSpreadType("daily_one_card");
    setQuestion("");
    setChoiceOptions({ a: "", b: "" });
    setIsRecoveringInput(false);
    setReadingRecoveryDrawSessionId(null);
    setRequestId(null);
    setResult(null);
    setError(null);
    setRetryMode(null);
    sessionStorage.removeItem(DRAFT_STORAGE_KEY);
    setPhase("spread");
  }

  const submitReading = useCallback(async () => {
    const completedDraw = drawState?.status === "complete" ? drawState : null;
    const drawSessionId = completedDraw?.drawSessionId ?? readingRecoveryDrawSessionId;
    if (!drawSessionId || inFlightRequestId.current) return;
    const nextRequestId = requestId ?? globalThis.crypto.randomUUID();
    let body;
    try {
      body = createTarotReadingRequest({
        spreadType,
        question,
        choiceOptions,
        requestId: nextRequestId,
        drawSessionId,
      });
    } catch (submissionError) {
      showError(submissionError instanceof Error ? submissionError.message : "입력을 확인해 주세요.", "reading");
      return;
    }

    inFlightRequestId.current = nextRequestId;
    setRequestId(nextRequestId);
    persistDraft(drawSessionId, nextRequestId);
    setError(null);
    setResult(null);
    setPhase("loading");

    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.status === 401) {
        redirectToLogin(drawSessionId, nextRequestId);
        if (completedDraw) setPhase("confirm");
        return;
      }
      if (!response.ok) {
        const apiError = await readApiError(response);
        if (response.status === 409 && apiError.code === "DRAW_SESSION_ALREADY_CONSUMED") {
          showError("이미 이 추첨으로 리딩이 생성되었어요. 기록을 확인하거나 새 추첨을 시작해 주세요.", "consumed");
          return;
        }
        showError(
          READING_ERROR_MESSAGES[response.status] ?? apiError.message ?? "리딩 요청을 처리하지 못했어요.",
          "reading",
        );
        return;
      }

      const payload = await response.json() as TarotReadingResponse;
      const validated = validateReadingResponse(payload, spreadType, completedDraw?.cards);
      setResult(validated.result);
      setResultCards(validated.cardIds);
      setRevealedResultCount(0);
      setRequestId(null);
      setReadingRecoveryDrawSessionId(null);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setPhase("result");
    } catch (readingError) {
      showError(
        readingError instanceof Error && readingError.message.startsWith("리딩 결과")
          ? readingError.message
          : "리딩 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
        "reading",
      );
    } finally {
      inFlightRequestId.current = null;
    }
  }, [choiceOptions, drawState, persistDraft, question, readingRecoveryDrawSessionId, redirectToLogin, requestId, showError, spreadType]);

  const handleConsentComplete = useCallback(() => {
    void submitReading();
  }, [submitReading]);

  function retry() {
    if (retryMode === "auth") void authenticateAndRestore();
    if (retryMode === "active") void loadActiveSession();
    if (retryMode === "start") void beginDraw();
    if (retryMode === "reading") void submitReading();
  }

  if (phase === "auth") {
    return (
      <ReadingShell eyebrow="AI TAROT" title="로그인 상태를 확인하고 있어요" step={1} totalSteps={4}>
        <div className="wizard-card loading-card" aria-live="polite">
          <p>잠시만 기다려 주세요.</p>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "spread") {
    return (
      <ReadingShell eyebrow="AI TAROT" title="어떤 마음을 살펴볼까요?" step={1} totalSteps={4}>
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
                <small>{spread.cardCount}장</small>
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
        description="입력 내용은 리딩 요청 전까지 이 브라우저의 짧은 임시 상태로만 보관합니다."
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
                placeholder="지금 살펴보고 싶은 상황을 적어주세요."
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
                <p className="form-error" role="alert">선택 A와 B는 서로 다르게 적어주세요.</p>
              ) : null}
            </div>
          ) : null}
          <button
            className="primary-button full-button"
            disabled={!inputIsValid || isOperationPending}
            onClick={() => isRecoveringInput ? resumeDrawAfterInput() : void beginDraw()}
            type="button"
          >
            카드 고르러 가기
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "draw" && drawState?.status === "in_progress") {
    return <DrawScreen
      definition={definition}
      drawState={drawState}
      isPending={isSelectionPending}
      onAbandon={() => setPhase("abandon-confirm")}
      onSelect={submitSelection}
      onKeyDown={handleCandidateKeyDown}
    />;
  }

  if (phase === "active-choice" && drawState) {
    return (
      <ReadingShell eyebrow={definition.name} title="진행 중인 추첨이 있어요" step={3} totalSteps={4}>
        <div className="wizard-card confirmation-card">
          <p className="notice">기존 추첨을 이어가거나 명시적으로 포기한 뒤 새로 시작할 수 있어요.</p>
          <div className="result-actions">
            <button
              className="primary-button"
              onClick={continueActiveDraw}
              type="button"
            >
              기존 추첨 이어가기
            </button>
            <button className="secondary-button" onClick={() => setPhase("abandon-confirm")} type="button">
              새 추첨 시작
            </button>
          </div>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "abandon-confirm" && drawState) {
    return (
      <ReadingShell eyebrow={definition.name} title="기존 추첨을 포기할까요?" step={3} totalSteps={4}>
        <div className="wizard-card confirmation-card">
          <p className="notice">확정한 위치는 복구할 수 없으며, 포기 완료 후 새 추첨을 시작할 수 있어요.</p>
          <div className="result-actions">
            <button
              className="secondary-button"
              disabled={isOperationPending}
              onClick={continueActiveDraw}
              type="button"
            >
              계속 이어가기
            </button>
            <button
              className="primary-button"
              disabled={isOperationPending}
              onClick={() => void abandonDraw()}
              type="button"
            >
              기존 추첨 포기
            </button>
          </div>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "confirm" && drawState?.status === "complete") {
    return (
      <ReadingShell eyebrow={definition.name} title="선택한 카드를 확인해 보세요" step={4} totalSteps={4}>
        <div className="wizard-card confirmation-card">
          <div className="draw-complete-grid">
            {drawState.cards.map((selectedCard) => {
              const position = definition.positions.find((item) => item.id === selectedCard.position);
              const card = CARD_INDEX.get(selectedCard.cardId);
              return (
                <article className="revealed-card" key={selectedCard.position}>
                  <span>{position?.label}</span>
                  <strong>{card?.name}</strong>
                </article>
              );
            })}
          </div>
          <div className="result-actions">
            <button
              className="primary-button"
              disabled={!inputIsValid}
              onClick={() => setPhase("consent")}
              type="button"
            >
              동의 확인 후 리딩 생성
            </button>
            <button className="secondary-button" onClick={() => setPhase("abandon-confirm")} type="button">
              새 추첨 시작
            </button>
          </div>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "consent") {
    return (
      <ReadingShell eyebrow={definition.name} title="리딩 전 필수 동의를 확인해요" step={4} totalSteps={4}>
        <ConsentGate
          onComplete={handleConsentComplete}
          onUnauthenticated={() => redirectToLogin(drawState?.drawSessionId)}
        />
      </ReadingShell>
    );
  }

  if (phase === "loading") {
    return (
      <ReadingShell eyebrow={definition.name} title="카드의 흐름을 읽고 있어요" step={4} totalSteps={4}>
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
          {retryMode === "consumed" ? (
            <div className="result-actions">
              <Link className="primary-button" href="/records">기존 기록 확인</Link>
              <button className="secondary-button" onClick={resetForNewDraw} type="button">새 추첨 준비</button>
            </div>
          ) : (
            <button className="secondary-button full-button" onClick={retry} type="button">
              {retryMode === "auth"
                ? "로그인 상태 다시 확인"
                : retryMode === "active"
                  ? "서버 상태 다시 확인"
                  : retryMode === "start"
                    ? "새 추첨 다시 시도"
                    : "리딩 생성 다시 시도"}
            </button>
          )}
        </div>
      </ReadingShell>
    );
  }

  if (phase === "result" && result) {
    const revealedPositions = definition.positions.slice(0, revealedResultCount);
    const allRevealed = revealedResultCount === definition.cardCount;
    return (
      <ReadingShell eyebrow={definition.name} title="카드가 전하는 메시지" step={4} totalSteps={4}>
        <div className="result-reveal-list">
          {revealedPositions.map((position, index) => {
            const card = CARD_INDEX.get(resultCards[index]);
            const section = result.sections[index];
            return (
              <article className="result-reveal" key={position.id}>
                <div className="revealed-card" aria-label={`${position.label}: ${card?.name ?? "카드"}`}>
                  <span>{position.label}</span>
                  <strong>{card?.name}</strong>
                </div>
                <div>
                  <h3>{section.heading}</h3>
                  <p>{section.body}</p>
                </div>
              </article>
            );
          })}
        </div>
        {!allRevealed ? (
          <button
            className="primary-button narrow-button reveal-button"
            onClick={() => setRevealedResultCount((count) => count + 1)}
            type="button"
          >
            {revealedResultCount === 0 ? "첫 카드 공개" : "다음 카드 공개"}
          </button>
        ) : (
          <div className="result-summary">
            <div className="result-hero">
              <p className="eyebrow">YOUR READING</p>
              <h2>{result.title}</h2>
              <p>{result.summary}</p>
            </div>
            <section className="reading-guidance">
              <h3>오늘부터 시도할 작은 행동</h3>
              <ul>{result.guidance.map((item) => <li key={item}>{item}</li>)}</ul>
            </section>
            <p className="reading-disclaimer">{result.disclaimer}</p>
            <div className="result-actions">
              <Link className="primary-button" href="/tarot">새 타로 리딩 시작</Link>
              <Link className="secondary-button" href="/records">내 기록 보기</Link>
            </div>
          </div>
        )}
      </ReadingShell>
    );
  }

  return null;
}

function DrawScreen({
  definition,
  drawState,
  isPending,
  onAbandon,
  onSelect,
  onKeyDown,
}: {
  definition: (typeof TAROT_SPREADS)[TarotSpreadType];
  drawState: TarotDrawInProgress;
  isPending: boolean;
  onAbandon: () => void;
  onSelect: (candidateToken: string) => Promise<void>;
  onKeyDown: (event: KeyboardEvent<HTMLButtonElement>, candidateToken: string) => void;
}) {
  const currentPosition = definition.positions[drawState.selectedCount];
  return (
    <ReadingShell eyebrow={definition.name} title={currentPosition.label} step={3} totalSteps={4}>
      <div className="wizard-card draw-panel">
        <p className="draw-progress" aria-live="polite">
          {drawState.selectedCount + 1} / {drawState.totalCount}
        </p>
        {drawState.selectedCount > 0 ? (
          <>
            <p className="selection-count">{drawState.selectedCount}개 위치 확정</p>
            <ol className="confirmed-draw-slots" aria-label="확정한 위치">
              {definition.positions.slice(0, drawState.selectedCount).map((position) => (
                <li key={position.id}>
                  <span>{position.label}</span>
                  <span
                    aria-label={`${position.label} 확정 카드 뒷면`}
                    className="confirmed-card-back"
                    role="img"
                  >
                    <i aria-hidden="true">◇</i>
                  </span>
                </li>
              ))}
            </ol>
          </>
        ) : null}
        <p className="draw-instruction">{currentPosition.instruction}</p>
        <div className="tarot-candidates" aria-label={`${currentPosition.label} 카드 후보`}>
          {drawState.candidates.map((candidate, index) => (
            <button
              aria-label={`숨은 카드 ${index + 1}`}
              className="tarot-back"
              disabled={isPending}
              key={candidate.token}
              onClick={() => void onSelect(candidate.token)}
              onKeyDown={(event) => onKeyDown(event, candidate.token)}
              type="button"
            >
              <span aria-hidden="true">◇</span>
            </button>
          ))}
        </div>
        <button className="secondary-button full-button narrow-button" onClick={onAbandon} type="button">
          새 추첨 시작
        </button>
      </div>
    </ReadingShell>
  );
}

function validateReadingResponse(
  payload: TarotReadingResponse,
  spreadType: TarotSpreadType,
  completedCards?: TarotDrawComplete["cards"],
): { result: TarotReadingResult; cardIds: string[] } {
  const reading = payload.reading;
  const definition = TAROT_SPREADS[spreadType];
  if (
    !reading
    || reading.spreadType !== spreadType
    || reading.schemaVersion !== 1
    || !reading.result
    || !Array.isArray(reading.input?.cards)
    || !Array.isArray(reading.result.sections)
    || reading.input.cards.length !== definition.cardCount
    || reading.result.sections.length !== definition.cardCount
  ) {
    throw new Error("리딩 결과 계약이 선택한 유형과 일치하지 않습니다.");
  }

  const seenCardIds = new Set<string>();
  for (let index = 0; index < definition.cardCount; index += 1) {
    const position = definition.positions[index].id;
    const inputCard = reading.input.cards[index];
    if (
      inputCard?.position !== position
      || typeof inputCard.cardId !== "string"
      || !CARD_INDEX.has(inputCard.cardId)
      || typeof inputCard.reversed !== "boolean"
      || seenCardIds.has(inputCard.cardId)
      || (completedCards && inputCard.cardId !== completedCards[index]?.cardId)
      || reading.result.sections[index]?.position !== position
    ) {
      throw new Error("리딩 결과의 카드와 해석 위치가 일치하지 않습니다.");
    }
    seenCardIds.add(inputCard.cardId);
  }
  return {
    result: reading.result,
    cardIds: reading.input.cards.map((card) => card.cardId),
  };
}

async function readApiError(response: Response): Promise<TarotDrawError> {
  try {
    const payload = await response.json() as Partial<TarotDrawError>;
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

function isRecoverableReadingDraft(
  draft: TarotDraft | null,
): draft is TarotDraft & { drawSessionId: string; requestId: string } {
  return Boolean(
    draft?.drawSessionId
    && draft.requestId
    && hasValidTarotInput(draft.spreadType, draft.question, draft.choiceOptions),
  );
}

function writeDraft(draft: TarotDraft): void {
  sessionStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
}

function readDraft(): TarotDraft | null {
  const raw = sessionStorage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<TarotDraft>;
    if (
      parsed.version !== 3
      || !parsed.spreadType
      || !(parsed.spreadType in TAROT_SPREADS)
      || typeof parsed.question !== "string"
      || typeof parsed.choiceOptions?.a !== "string"
      || typeof parsed.choiceOptions?.b !== "string"
      || (parsed.drawSessionId !== undefined && typeof parsed.drawSessionId !== "string")
      || (parsed.requestId !== undefined && typeof parsed.requestId !== "string")
    ) {
      return null;
    }
    return parsed as TarotDraft;
  } catch {
    return null;
  }
}
