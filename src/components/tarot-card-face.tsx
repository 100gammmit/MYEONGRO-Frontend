import Image from "next/image";

import { MAJOR_ARCANA } from "@/domain/tarot";

// Card front: the illustration alone, full bleed like the back. The arcana number and name sit in
// a caption under the card instead, so nothing is printed over the art.
const ROMAN = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
] as const;

const CARD_IDS = new Set<string>(MAJOR_ARCANA.map((card) => card.id));

function romanFor(cardId: string): string | null {
  const match = /^major-(\d{2})-/.exec(cardId);
  return match ? ROMAN[Number(match[1])] ?? null : null;
}

// Each front is pre-cut to the card ratio (480×773, like back-480.webp), so the image optimizer
// has nothing to add and this path stays identical to the one the result screen preloads.
export function tarotCardImageSrc(cardId: string): string | null {
  return CARD_IDS.has(cardId) ? `/images/tarot/major-arcana/${cardId}-480.webp` : null;
}

export function TarotCardFace({ cardId }: { cardId: string }) {
  const src = tarotCardImageSrc(cardId);
  return (
    <div className="card-face">
      {/* The caption prints the card's name, so the art itself is decoration. */}
      {src ? <Image alt="" fill src={src} unoptimized /> : null}
    </div>
  );
}

export function TarotCardCaption({
  cardId,
  name,
  className,
}: {
  cardId: string;
  name: string;
  className?: string;
}) {
  const roman = romanFor(cardId);
  return (
    <p className={className ? `tarot-card-caption ${className}` : "tarot-card-caption"}>
      {/* A screen reader would spell the numeral out letter by letter; the name is enough. */}
      {roman ? <span aria-hidden="true" className="tarot-card-number">{roman} · </span> : null}
      {name}
    </p>
  );
}
