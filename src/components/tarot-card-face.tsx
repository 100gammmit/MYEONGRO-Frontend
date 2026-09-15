// Typeset card front (design canvas sheet 15): no illustration, only the arcana number and name,
// framed like the back so turning the card over keeps its weight. Sizes follow the card width (cqw).
const ROMAN = [
  "0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI",
] as const;

function romanFor(cardId: string): string | null {
  const match = /^major-(\d{2})-/.exec(cardId);
  return match ? ROMAN[Number(match[1])] ?? null : null;
}

// One-syllable names (힘·탑·별·달) get the largest size; 운명의 수레바퀴 the smallest.
function nameSize(name: string): string {
  const length = name.replace(/\s/g, "").length;
  if (length >= 5) return " long";
  if (length <= 2) return " short";
  return "";
}

export function TarotCardFace({ cardId, name }: { cardId: string; name: string }) {
  const roman = romanFor(cardId);
  return (
    <div className={`card-face${nameSize(name)}`}>
      <i aria-hidden="true" className="face-frame" />
      <i aria-hidden="true" className="face-frame inner" />
      <i aria-hidden="true" className="face-corner tl" />
      <i aria-hidden="true" className="face-corner tr" />
      <i aria-hidden="true" className="face-corner bl" />
      <i aria-hidden="true" className="face-corner br" />
      {roman ? <span aria-hidden="true" className="face-number">{roman}</span> : null}
      <i aria-hidden="true" className="face-rule" />
      <span className="face-name">{name}</span>
      <i aria-hidden="true" className="face-seal" />
    </div>
  );
}
