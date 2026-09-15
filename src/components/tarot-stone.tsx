// Five cut stones, one per draw slot, set in the well of the card back (design canvas sheets 13–14).
// Each stone is only a list of layer classes over its base colour, so one template draws all five.
const BRILLIANT = [
  "l2 f1", "d1 f2", "d2 f3", "d3 f4", "d2 f5", "d1 f6", "l2 f7", "l3 f8",
  "tbl", "l3 s1", "d1 s2", "d1 s3", "l2 s4",
] as const;

// Ordered dark to light so the five read as a sequence across the row.
export const TAROT_STONES = ["obsidian", "sapphire", "ruby", "emerald", "pearl"] as const;

export type TarotStoneKind = (typeof TAROT_STONES)[number];

const LAYERS: Readonly<Record<TarotStoneKind, readonly string[]>> = {
  obsidian: ["sh", "cc", "fl2", "fl", "rim"],
  sapphire: [...BRILLIANT, "fa1", "fa2", "rim"],
  ruby: [...BRILLIANT, "fa1", "fa2", "rim"],
  emerald: ["dl", "dr", "r1", "r2", "r3", "fl", "rim"],
  pearl: ["sh", "ov", "rl", "hl"],
};

export function stoneForSlot(slot: number): TarotStoneKind {
  return TAROT_STONES[(slot - 1 + TAROT_STONES.length) % TAROT_STONES.length];
}

export function TarotStone({ kind }: { kind: TarotStoneKind }) {
  const brilliant = kind === "sapphire" || kind === "ruby";
  return (
    <span aria-hidden="true" className={`tarot-stone stone-${kind}${brilliant ? " stone-brilliant" : ""}`}>
      {LAYERS[kind].map((layer, index) => <i className={layer} key={index} />)}
    </span>
  );
}
