"use client";

import { useRef, useState } from "react";
import { MAJOR_ARCANA } from "@/domain/tarot";
import { ConsentGate } from "./consent-gate";
import { DeepReadingCta } from "./deep-reading-cta";
import { ReadingShell } from "./reading-shell";

type TarotReadingSection = {
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
    result?: TarotReadingResult;
  };
};

const MIN_QUESTION_LENGTH = 5;
const MAX_QUESTION_LENGTH = 300;
const POSITION_LABELS = ["과거", "현재", "조언"] as const;

const CARD_INDEX: ReadonlyMap<string, (typeof MAJOR_ARCANA)[number]> = new Map(
  MAJOR_ARCANA.map((card) => [card.id, card]),
);

export function TarotExperience() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [question, setQuestion] = useState("");
  const [selectedCardIds, setSelectedCardIds] = useState<string[]>([]);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TarotReadingResult | null>(null);
  const inFlightRequestId = useRef<string | null>(null);

  const questionIsValid = question.trim().length >= MIN_QUESTION_LENGTH;
  const canRead = selectedCardIds.length === 3;

  function resetPreviewState() {
    setError(null);
    setResult(null);
    setRequestId(null);
  }

  function handleQuestionChange(value: string) {
    setQuestion(value.slice(0, MAX_QUESTION_LENGTH));
    if (!submitting) {
      resetPreviewState();
    }
  }

  function toggleCard(cardId: string) {
    if (submitting) {
      return;
    }

    resetPreviewState();
    setSelectedCardIds((current) => {
      if (current.includes(cardId)) {
        return current.filter((id) => id !== cardId);
      }

      if (current.length >= 3) {
        return current;
      }

      return [...current, cardId];
    });
  }

  async function submitReading() {
    if (submitting || inFlightRequestId.current || !canRead || !questionIsValid) {
      return;
    }

    const trimmedQuestion = question.trim();
    const nextRequestId = requestId ?? globalThis.crypto.randomUUID();

    inFlightRequestId.current = nextRequestId;
    setRequestId(nextRequestId);
    setSubmitting(true);
    setError(null);
    setResult(null);
    setStep(4);

    try {
      const response = await fetch("/api/readings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kind: "tarot",
          question: trimmedQuestion,
          requestId: nextRequestId,
          cardIds: selectedCardIds,
        }),
      });

      if (!response.ok) {
        throw new Error("failed");
      }

      const payload = (await response.json()) as TarotReadingResponse;
      if (!payload.reading.result) {
        throw new Error("missing reading result");
      }

      setResult(payload.reading.result);
      setError(null);
      setRequestId(null);
    } catch {
      setError("타로 리딩을 불러오지 못했어요. 다시 시도해 주세요.");
    } finally {
      inFlightRequestId.current = null;
      setSubmitting(false);
    }
  }

  function retryReading() {
    if (submitting) {
      return;
    }

    void submitReading();
  }

  if (step === 1) {
    return (
      <ReadingShell eyebrow="AI TAROT" title="카드가 당신을 기다리고 있어요" step={1} totalSteps={4}>
        <ConsentGate onComplete={() => setStep(2)} />
      </ReadingShell>
    );
  }

  if (step === 2) {
    return (
      <ReadingShell
        eyebrow="AI TAROT"
        title="무엇이 가장 궁금한가요?"
        description="질문이 구체적일수록 카드의 메시지도 선명해집니다."
        step={2}
        totalSteps={4}
      >
        <div className="wizard-card">
          <label className="field">
            <span>카드에게 묻고 싶은 질문</span>
            <textarea
              maxLength={MAX_QUESTION_LENGTH}
              value={question}
              onChange={(event) => handleQuestionChange(event.target.value)}
              placeholder="예: 지금 마음에 둔 사람과 관계가 어떻게 흘러갈까요?"
            />
            <small>
              {question.length} / {MAX_QUESTION_LENGTH}
            </small>
          </label>
          <button
            className="primary-button full-button"
            disabled={!questionIsValid}
            onClick={() => setStep(3)}
            type="button"
          >
            카드 고르러 가기
          </button>
        </div>
      </ReadingShell>
    );
  }

  if (step === 3) {
    return (
      <ReadingShell
        eyebrow="AI TAROT"
        title="세 장의 카드를 골라주세요"
        description="중복 없이 정확히 3장을 골라야 리딩이 시작됩니다."
        step={3}
        totalSteps={4}
      >
        <div className="wizard-card">
          <p className="selection-count">
            선택한 카드 {selectedCardIds.length} / 3
          </p>
          <div className="tarot-deck">
            {MAJOR_ARCANA.map((card, index) => {
              const selectedIndex = selectedCardIds.indexOf(card.id);
              const selected = selectedIndex !== -1;

              return (
                <button
                  aria-label={card.name}
                  aria-pressed={selected}
                  className={selected ? "tarot-back selected" : "tarot-back"}
                  key={card.id}
                  onClick={() => toggleCard(card.id)}
                  type="button"
                >
                  <span aria-hidden="true">{selected ? selectedIndex + 1 : index + 1}</span>
                  <strong aria-hidden="true">{card.name}</strong>
                </button>
              );
            })}
          </div>
          <button
            className="primary-button full-button narrow-button"
            disabled={!canRead || submitting}
            onClick={() => void submitReading()}
            type="button"
          >
            리딩 받기
          </button>
        </div>
      </ReadingShell>
    );
  }

  const resultCards = selectedCardIds.flatMap((cardId, index) => {
    const card = CARD_INDEX.get(cardId);
    if (!card) {
      return [];
    }

    return [{ card, label: POSITION_LABELS[index] }];
  });

  return (
    <ReadingShell eyebrow="AI TAROT" title="카드가 전하는 오늘의 메시지" step={4} totalSteps={4}>
      {submitting ? (
        <div className="wizard-card" aria-live="polite">
          <p>카드를 읽는 중</p>
        </div>
      ) : error ? (
        <div className="wizard-card" role="alert">
          <p>{error}</p>
          <button className="secondary-button" type="button" onClick={retryReading}>
            다시 시도
          </button>
        </div>
      ) : result ? (
        <>
          <div className="result-hero">
            <p className="eyebrow">YOUR READING</p>
            <h2>{result.title}</h2>
            <p>{result.summary}</p>
          </div>
          <div className="result-cards">
            {resultCards.map(({ card, label }) => (
              <article key={card.id}>
                <span>{label}</span>
                <div className="revealed-card">
                  <strong>{card.name}</strong>
                </div>
              </article>
            ))}
          </div>
          <div className="reading-sections">
            {result.sections.map((section) => (
              <article key={section.heading}>
                <h3>{section.heading}</h3>
                <p>{section.body}</p>
              </article>
            ))}
          </div>
          <div className="reading-guidance">
            <h3>조언</h3>
            <ul>
              {result.guidance.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <p className="reading-disclaimer">{result.disclaimer}</p>
          <div className="deep-reading">
            <div>
              <p className="eyebrow">DEEP READING</p>
              <h2>더 깊은 해석이 필요하다면</h2>
              <p>선택한 카드가 남긴 질문을 더 길게 풀어보는 유료 해석으로 이어갈 수 있습니다.</p>
            </div>
            <div className="price-box">
              <strong>3,900원</strong>
              <span>상세 해설 + 연속 질문 2개</span>
              <DeepReadingCta kind="tarot" />
            </div>
          </div>
        </>
      ) : null}
    </ReadingShell>
  );
}
