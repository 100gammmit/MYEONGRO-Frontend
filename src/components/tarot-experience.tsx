"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import {
  DAILY_QUESTION,
  MAJOR_ARCANA,
  TAROT_SPREAD_LIST,
  TAROT_SPREADS,
  createTarotReadingRequest,
  drawCandidateCardIds,
  type TarotChoiceOptions,
  type TarotPositionId,
  type TarotSpreadType,
} from "@/domain/tarot";
import { ConsentGate } from "./consent-gate";
import { ReadingShell } from "./reading-shell";

const MAX_QUESTION_LENGTH = 300;
const MAX_CHOICE_LENGTH = 100;
const DRAFT_STORAGE_KEY = "myeongro:tarot-draft";

type Phase =
  | "spread"
  | "input"
  | "draw"
  | "confirm"
  | "consent"
  | "loading"
  | "result"
  | "error";

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
  spreadType: TarotSpreadType;
  question: string;
  choiceOptions: TarotChoiceOptions;
  cardIds: string[];
};

const CARD_INDEX = new Map<string, (typeof MAJOR_ARCANA)[number]>(
  MAJOR_ARCANA.map((card) => [card.id, card]),
);

const ERROR_MESSAGES: Readonly<Record<number, string>> = {
  403: "필수 동의를 완료한 뒤 다시 리딩을 생성해 주세요.",
  409: "같은 요청을 처리하고 있어요. 잠시 후 다시 확인해 주세요.",
  429: "오늘의 무료 리딩 이용 한도에 도달했어요.",
  502: "리딩 생성에 실패했어요. 잠시 후 다시 시도해 주세요.",
};

export function TarotExperience() {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("spread");
  const [spreadType, setSpreadType] = useState<TarotSpreadType>("daily_one_card");
  const [question, setQuestion] = useState("");
  const [choiceOptions, setChoiceOptions] = useState<TarotChoiceOptions>({ a: "", b: "" });
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [candidateCardIds, setCandidateCardIds] = useState<string[]>([]);
  const [revealedCandidateId, setRevealedCandidateId] = useState<string | null>(null);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [result, setResult] = useState<TarotReadingResult | null>(null);
  const [resultCards, setResultCards] = useState<string[]>([]);
  const [revealedResultCount, setRevealedResultCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inFlightRequestId = useRef<string | null>(null);

  const definition = TAROT_SPREADS[spreadType];
  const currentPosition = definition.positions[selectedCardIds.length];
  const questionIsValid = definition.inputMode === "fixed"
    || question.trim().length >= 1;
  const choicesAreValid = definition.inputMode !== "choice"
    || (
      choiceOptions.a.trim().length >= 1
      && choiceOptions.b.trim().length >= 1
      && choiceOptions.a.trim() !== choiceOptions.b.trim()
    );
  const inputIsValid = questionIsValid && choicesAreValid;

  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    setSpreadType(draft.spreadType);
    setQuestion(draft.question);
    setChoiceOptions(draft.choiceOptions);
    setSelectedCardIds(draft.cardIds);
    setPhase("confirm");
  }, []);

  function selectSpread(nextSpreadType: TarotSpreadType) {
    setSpreadType(nextSpreadType);
    setQuestion("");
    setChoiceOptions({ a: "", b: "" });
    setSelectedCardIds([]);
    setCandidateCardIds([]);
    setRevealedCandidateId(null);
    setRequestId(null);
    setResult(null);
    setError(null);
  }

  function beginDraw() {
    if (!inputIsValid) return;
    setSelectedCardIds([]);
    setCandidateCardIds(drawCandidateCardIds([]));
    setRevealedCandidateId(null);
    setPhase("draw");
  }

  function continueDraw() {
    if (!revealedCandidateId) return;
    const nextSelected = [...selectedCardIds, revealedCandidateId];
    setSelectedCardIds(nextSelected);
    setRevealedCandidateId(null);
    if (nextSelected.length === definition.cardCount) {
      setPhase("confirm");
      return;
    }
    setCandidateCardIds(drawCandidateCardIds(nextSelected));
  }

  const submitReading = useCallback(async () => {
    if (inFlightRequestId.current) return;
    const nextRequestId = requestId ?? globalThis.crypto.randomUUID();
    let body;
    try {
      body = createTarotReadingRequest({
        spreadType,
        question,
        choiceOptions,
        requestId: nextRequestId,
        cardIds: selectedCardIds,
      });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "입력을 확인해 주세요.");
      setPhase("error");
      return;
    }

    inFlightRequestId.current = nextRequestId;
    setRequestId(nextRequestId);
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
        writeDraft({ spreadType, question, choiceOptions, cardIds: selectedCardIds });
        setPhase("confirm");
        router.push("/login?next=%2Ftarot");
        return;
      }
      if (!response.ok) {
        setError(ERROR_MESSAGES[response.status] ?? "리딩 요청을 처리하지 못했어요.");
        setPhase("error");
        return;
      }

      const payload = await response.json() as TarotReadingResponse;
      const validated = validateReadingResponse(payload, spreadType, selectedCardIds);
      setResult(validated.result);
      setResultCards(validated.cardIds);
      setRevealedResultCount(0);
      setRequestId(null);
      sessionStorage.removeItem(DRAFT_STORAGE_KEY);
      setPhase("result");
    } catch (readingError) {
      setError(
        readingError instanceof Error && readingError.message.startsWith("리딩 결과")
          ? readingError.message
          : "리딩 서버에 연결하지 못했어요. 잠시 후 다시 시도해 주세요.",
      );
      setPhase("error");
    } finally {
      inFlightRequestId.current = null;
    }
  }, [choiceOptions, question, requestId, router, selectedCardIds, spreadType]);

  const handleConsentComplete = useCallback(() => {
    void submitReading();
  }, [submitReading]);

  async function verifyLoginAndContinue() {
    if (inFlightRequestId.current) return;
    writeDraft({ spreadType, question, choiceOptions, cardIds: selectedCardIds });
    try {
      const response = await fetch("/api/me", { credentials: "same-origin" });
      if (!response.ok && response.status !== 401) {
        setError("로그인 상태를 확인하지 못했어요. 서버 연결 상태를 확인하고 다시 시도해 주세요.");
        setPhase("error");
        return;
      }
      const payload = response.ok
        ? await response.json() as { authenticated?: boolean }
        : { authenticated: false };
      if (payload.authenticated !== true) {
        router.push("/login?next=%2Ftarot");
        return;
      }
      setPhase("consent");
    } catch {
      setError("로그인 상태를 확인하지 못했어요. 다시 시도해 주세요.");
      setPhase("error");
    }
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
        description="입력한 내용은 로그인 전에는 브라우저의 짧은 임시 상태로만 다룹니다."
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
          <button className="primary-button full-button" disabled={!inputIsValid} onClick={beginDraw} type="button">
            카드 고르러 가기
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "draw" && currentPosition) {
    const round = selectedCardIds.length + 1;
    return (
      <ReadingShell eyebrow={definition.name} title={currentPosition.label} step={3} totalSteps={4}>
        <div className="wizard-card draw-panel">
          <p className="draw-progress" aria-live="polite">{round} / {definition.cardCount}</p>
          <p className="draw-instruction">{currentPosition.instruction}</p>
          <div className="tarot-candidates" aria-label={`${currentPosition.label} 카드 후보`}>
            {candidateCardIds.map((cardId, index) => {
              const revealed = revealedCandidateId === cardId;
              const card = CARD_INDEX.get(cardId);
              return (
                <button
                  aria-label={revealed ? `선택한 카드: ${card?.name ?? "카드"}` : `숨은 카드 ${index + 1}`}
                  className={revealed ? "tarot-back selected revealed" : "tarot-back"}
                  disabled={revealedCandidateId !== null}
                  key={cardId}
                  onClick={() => setRevealedCandidateId(cardId)}
                  type="button"
                >
                  {revealed ? <strong>{card?.name}</strong> : <span aria-hidden="true">◇</span>}
                </button>
              );
            })}
          </div>
          {revealedCandidateId ? (
            <p className="selection-count" aria-live="polite">
              선택한 카드: {CARD_INDEX.get(revealedCandidateId)?.name}
            </p>
          ) : null}
          <button
            className="primary-button full-button narrow-button"
            disabled={!revealedCandidateId}
            onClick={continueDraw}
            type="button"
          >
            {round === definition.cardCount ? "선택 완료" : "다음 카드 선택"}
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "confirm") {
    return (
      <ReadingShell eyebrow={definition.name} title="이 선택으로 리딩을 시작할까요?" step={4} totalSteps={4}>
        <div className="wizard-card confirmation-card">
          <p className="notice">실제 AI 리딩 생성은 로그인과 필수 동의 확인 후 시작됩니다.</p>
          <ol className="selected-card-list">
            {definition.positions.map((position, index) => (
              <li key={position.id}>
                <span>{position.label}</span>
                <strong>{CARD_INDEX.get(selectedCardIds[index])?.name}</strong>
              </li>
            ))}
          </ol>
          <button className="primary-button full-button" onClick={() => void verifyLoginAndContinue()} type="button">
            로그인 확인 후 리딩 생성
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (phase === "consent") {
    return (
      <ReadingShell eyebrow={definition.name} title="리딩 전 필수 동의를 확인해요" step={4} totalSteps={4}>
        <ConsentGate
          onComplete={handleConsentComplete}
          onUnauthenticated={() => {
            writeDraft({ spreadType, question, choiceOptions, cardIds: selectedCardIds });
            router.push("/login?next=%2Ftarot");
          }}
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
          <button className="secondary-button full-button" onClick={() => void verifyLoginAndContinue()} type="button">
            다시 시도
          </button>
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

function validateReadingResponse(
  payload: TarotReadingResponse,
  spreadType: TarotSpreadType,
  selectedCardIds: readonly string[],
): { result: TarotReadingResult; cardIds: string[] } {
  const reading = payload.reading;
  const definition = TAROT_SPREADS[spreadType];
  if (
    reading.spreadType !== spreadType
    || reading.schemaVersion !== 1
    || !reading.result
    || reading.input.cards.length !== definition.cardCount
    || reading.result.sections.length !== definition.cardCount
  ) {
    throw new Error("리딩 결과 계약이 선택한 유형과 일치하지 않습니다.");
  }

  for (let index = 0; index < definition.cardCount; index += 1) {
    const position = definition.positions[index].id;
    if (
      reading.input.cards[index]?.position !== position
      || reading.input.cards[index]?.cardId !== selectedCardIds[index]
      || reading.result.sections[index]?.position !== position
    ) {
      throw new Error("리딩 결과의 카드와 해석 위치가 일치하지 않습니다.");
    }
  }
  return {
    result: reading.result,
    cardIds: reading.input.cards.map((card) => card.cardId),
  };
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
      !parsed.spreadType
      || !(parsed.spreadType in TAROT_SPREADS)
      || typeof parsed.question !== "string"
      || typeof parsed.choiceOptions?.a !== "string"
      || typeof parsed.choiceOptions?.b !== "string"
      || !Array.isArray(parsed.cardIds)
      || parsed.cardIds.length !== TAROT_SPREADS[parsed.spreadType].cardCount
      || parsed.cardIds.some((cardId) => typeof cardId !== "string" || !CARD_INDEX.has(cardId))
    ) {
      return null;
    }
    return parsed as TarotDraft;
  } catch {
    return null;
  }
}
