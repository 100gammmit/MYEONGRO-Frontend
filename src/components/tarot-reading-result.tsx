"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  MAJOR_ARCANA,
  TAROT_SPREADS,
  type AiTarotSpreadType,
  type TarotPositionId,
} from "@/domain/tarot";
import {
  readingModeNotice,
  tarotPositionLabel,
  type ReadingMode,
} from "@/domain/reading/reading-mode";
import { ReadingShell } from "./reading-shell";
import { TarotCardFace } from "./tarot-card-face";

export type TarotReadingResultData = {
  readingMode: ReadingMode;
  title: string;
  summary: string;
  sections: Array<{
    position: TarotPositionId;
    heading: string;
    body: string;
  }>;
  guidance: string[];
  disclaimer: string;
};

const CARD_INDEX = new Map<string, (typeof MAJOR_ARCANA)[number]>(
  MAJOR_ARCANA.map((card) => [card.id, card]),
);

// A revealed card lands on its back and turns over to the typeset front, as drawn on the canvas.
function RevealedCard({ cardId, label, name }: { cardId: string; label: string; name: string }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    // Paint the back first, then turn on the next tick so the 700ms transition actually runs.
    const timer = window.setTimeout(() => setFlipped(true), 40);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="revealed-card" aria-label={`${label}: ${name}`}>
      <span className="revealed-card-label">{label}</span>
      <div className="card-flip">
        <div className={flipped ? "card-flip-inner flipped" : "card-flip-inner"}>
          <div aria-hidden="true" className="card-flip-back tarot-back-art" />
          <div className="card-flip-front">
            <TarotCardFace cardId={cardId} name={name} />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TarotReadingResult({
  spreadType,
  cardIds,
  result,
}: {
  spreadType: AiTarotSpreadType;
  cardIds: string[];
  result: TarotReadingResultData;
}) {
  const [revealedCount, setRevealedCount] = useState(0);
  const definition = TAROT_SPREADS[spreadType];
  const revealedPositions = definition.positions.slice(0, revealedCount);
  const allRevealed = revealedCount === definition.cardCount;
  const modeNotice = readingModeNotice(result.readingMode);

  return (
    <ReadingShell eyebrow={definition.name} title="카드가 전하는 메시지" step={4} totalSteps={4}>
      <div className="result-reveal-list">
        {revealedPositions.map((position, index) => {
          const card = CARD_INDEX.get(cardIds[index]);
          const section = result.sections[index];
          return (
            <article className="result-reveal" key={position.id}>
              <RevealedCard
                cardId={card?.id ?? ""}
                label={tarotPositionLabel(result.readingMode, position.id, position.label)}
                name={card?.name ?? "카드"}
              />
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
          onClick={() => setRevealedCount((count) => count + 1)}
          type="button"
        >
          {revealedCount === 0 ? "첫 카드 공개" : "다음 카드 공개"}
        </button>
      ) : (
        <div className="result-summary">
          <div className="result-hero">
            <p className="eyebrow">YOUR READING</p>
            <h2>{result.title}</h2>
            <p>{result.summary}</p>
          </div>
          {modeNotice ? <aside className="reading-mode-notice">{modeNotice}</aside> : null}
          <section className="reading-guidance">
            <h3>오늘부터 시도할 작은 행동</h3>
            <ul>{result.guidance.map((item) => <li key={item}>{item}</li>)}</ul>
          </section>
          <p className="reading-disclaimer">{result.disclaimer}</p>
          <div className="result-actions">
            <Link className="primary-button" href="/tarot">새로운 리딩 시작</Link>
            <Link className="secondary-button" href="/records">내 기록 보기</Link>
          </div>
        </div>
      )}
    </ReadingShell>
  );
}
