"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

import {
  MAJOR_ARCANA,
  TAROT_SPREADS,
  type AiTarotSpreadType,
} from "@/domain/tarot";
import { redirectedReadingNotice, tarotPositionLabel } from "@/domain/reading/reading-mode";
import type { TarotReadingResultData } from "@/domain/tarot/result-view";
import { ReadingModeNotice } from "./reading-mode-notice";
import { ReadingResultHeader } from "./reading-result-header";
import { TarotCardCaption, TarotCardFace, tarotCardImageSrc } from "./tarot-card-face";

// How a saved reading is framed when it is reopened from 내 기록.
export type TarotRecordFrame = {
  backHref: string;
  backLabel: string;
  dateLabel: string;
  footer?: ReactNode;
};

const CARD_INDEX = new Map<string, (typeof MAJOR_ARCANA)[number]>(
  MAJOR_ARCANA.map((card) => [card.id, card]),
);

const CARD_COUNT_WORDS: Readonly<Record<number, string>> = { 1: "한", 3: "세", 5: "다섯" };

// A choice reading weighs its last two cards against each other; the rest are the criteria.
const OPTION_POSITIONS = new Set(["option_a", "option_b"]);

// A revealed card lands on its back and turns over to its illustrated front, then the caption
// names it. A reopened record skips the turn and starts face up.
function RevealedCard({
  cardId,
  label,
  name,
  instant = false,
}: {
  cardId: string;
  label: string;
  name: string;
  instant?: boolean;
}) {
  const [flipped, setFlipped] = useState(instant);

  useEffect(() => {
    if (instant) return;
    // Paint the back first, then turn on the next tick so the 700ms transition actually runs.
    const timer = window.setTimeout(() => setFlipped(true), 40);
    return () => window.clearTimeout(timer);
  }, [instant]);

  return (
    <div className="revealed-card" aria-label={`${label}: ${name}`}>
      <div className="card-flip">
        <div className={flipped ? "card-flip-inner flipped" : "card-flip-inner"}>
          <div aria-hidden="true" className="card-flip-back tarot-back-art" />
          <div className="card-flip-front">
            <TarotCardFace cardId={cardId} />
          </div>
        </div>
      </div>
      <TarotCardCaption cardId={cardId} className={flipped ? "shown" : undefined} name={name} />
    </div>
  );
}

type PanelData = {
  key: string;
  index: number;
  label: string;
  cardId: string;
  cardName: string;
  heading: string;
  body: string;
};

// One card beside its interpretation. Until it is revealed the card shows its back, and the next
// card in turn carries the button that reveals it, so the button sits where the reading continues.
function ResultPanel({
  panel,
  revealed,
  next,
  instant,
  onReveal,
}: {
  panel: PanelData;
  revealed: boolean;
  next: boolean;
  instant: boolean;
  onReveal: () => void;
}) {
  return (
    <li className={revealed ? "result-panel" : "result-panel closed"}>
      <div className="result-panel-card">
        {revealed ? (
          <RevealedCard cardId={panel.cardId} instant={instant} label={panel.label} name={panel.cardName} />
        ) : (
          <span aria-hidden="true" className="result-panel-back tarot-back-art" />
        )}
      </div>
      <div className="result-panel-body">
        <p className="result-position">{panel.label}</p>
        {revealed ? (
          <>
            <h3>{panel.heading}</h3>
            <p>{panel.body}</p>
          </>
        ) : (
          <p className="result-waiting">아직 공개하지 않은 카드예요.</p>
        )}
        {next ? (
          <button className="primary-button reveal-button" onClick={onReveal} type="button">
            이 카드 공개
          </button>
        ) : null}
      </div>
    </li>
  );
}

export function TarotReadingResult({
  spreadType,
  cardIds,
  result,
  record,
}: {
  spreadType: AiTarotSpreadType;
  cardIds: string[];
  result: TarotReadingResultData;
  record?: TarotRecordFrame;
}) {
  const definition = TAROT_SPREADS[spreadType];
  // The one-by-one reveal is for the first reading; a reopened record shows every card at once.
  const [revealedCount, setRevealedCount] = useState(record ? definition.cardCount : 0);
  const allRevealed = revealedCount === definition.cardCount;
  const summaryRef = useRef<HTMLElement>(null);
  const revealedOnScreen = useRef(false);

  // Fetch every drawn front up front, so a card revealed later never turns over to an empty face.
  // A <link rel="preload"> would warn in the console while a card waits for its click; an Image
  // does not, and the document hands its loaded picture to the <img> that later asks for it.
  const warmedFronts = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    warmedFronts.current = cardIds.flatMap((cardId) => {
      const src = tarotCardImageSrc(cardId);
      if (!src) return [];
      const image = new Image();
      image.src = src;
      return [image];
    });
  }, [cardIds]);

  // The summary opens above the cards once the last one turns, so the reader is taken up to it.
  useEffect(() => {
    if (allRevealed && revealedOnScreen.current) summaryRef.current?.focus();
  }, [allRevealed]);

  function revealNext() {
    revealedOnScreen.current = true;
    setRevealedCount((count) => Math.min(count + 1, definition.cardCount));
  }

  const panels: PanelData[] = definition.positions.map((position, index) => {
    const card = CARD_INDEX.get(cardIds[index]);
    const section = result.sections[index];
    return {
      key: position.id,
      index,
      label: tarotPositionLabel(result.readingMode, position.id, position.label),
      cardId: card?.id ?? "",
      cardName: card?.name ?? "카드",
      heading: section.heading,
      body: section.body,
    };
  });
  // A redirected choice reading relabels the option cards as conditions, so it is not split as a choice.
  const isChoice = spreadType === "choice_five_card" && result.readingMode === "standard";
  const groups = isChoice
    ? [
      { id: "tarot-criteria", title: "선택의 기준", panels: panels.filter((panel) => !OPTION_POSITIONS.has(panel.key)), compare: false },
      { id: "tarot-compare", title: "두 선택 비교", panels: panels.filter((panel) => OPTION_POSITIONS.has(panel.key)), compare: true },
    ]
    : [{ id: "tarot-cards", title: "카드별 해석", panels, compare: false }];

  return (
    <article className="tarot-result page-width">
      <ReadingResultHeader
        backHref={record?.backHref ?? "/tarot"}
        backLabel={record?.backLabel ?? "타로"}
        meta={[definition.name, record?.dateLabel]}
        title={allRevealed ? result.title : `카드 ${CARD_COUNT_WORDS[definition.cardCount]} 장이 놓였어요`}
      >
        {/* The changed focus is explained before the cards, whose position labels already reflect it. */}
        <ReadingModeNotice notice={redirectedReadingNotice(result.readingMode, result.questionRedirected)} />
      </ReadingResultHeader>

      {allRevealed ? (
        <section className="result-answer" aria-labelledby="tarot-summary-label" ref={summaryRef} tabIndex={-1}>
          <h2 className="result-answer-label" id="tarot-summary-label">리딩 요약</h2>
          <p>{result.summary}</p>
        </section>
      ) : (
        <section className="result-answer waiting" aria-labelledby="tarot-summary-label">
          <h2 className="result-answer-label" id="tarot-summary-label">리딩 요약</h2>
          <p>카드를 한 장씩 공개하면, 마지막 카드 다음에 이 자리에 요약이 열려요.</p>
        </section>
      )}

      {groups.map((group) => (
        <section className="result-group" aria-labelledby={group.id} key={group.id}>
          <h2 id={group.id}>{group.title}</h2>
          <ol className={group.compare ? "result-panels compare" : "result-panels"}>
            {group.panels.map((panel) => (
              <ResultPanel
                instant={Boolean(record)}
                key={panel.key}
                next={!record && panel.index === revealedCount}
                onReveal={revealNext}
                panel={panel}
                revealed={panel.index < revealedCount}
              />
            ))}
          </ol>
        </section>
      ))}

      {allRevealed ? (
        <div className="result-closing">
          <p className="reading-disclaimer">{result.disclaimer}</p>
          {record ? record.footer : (
            <div className="result-actions">
              <Link className="primary-button" href="/tarot">새로운 리딩 시작</Link>
              <Link className="secondary-button" href="/records">내 기록 보기</Link>
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}
