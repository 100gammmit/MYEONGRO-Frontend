// Four pillar strokes around a card: the mark belongs to neither tarot nor saju, so both flows can use it.
const STROKES = [
  [13, 16, 29],
  [13, 35, 48],
  [51, 16, 29],
  [51, 35, 48],
] as const;

export function BrandMark({
  lit = STROKES.length,
  size = 64,
  breathing = false,
  seal = false,
}: {
  lit?: number;
  size?: number;
  breathing?: boolean;
  /** The resting brand mark in seal ink, as in the header; it never animates. */
  seal?: boolean;
}) {
  const className = ["mark-glyph", breathing ? "breathing" : "", seal ? "seal" : ""].filter(Boolean).join(" ");
  return (
    <svg
      aria-hidden="true"
      className={className}
      focusable="false"
      height={size}
      viewBox="0 0 64 64"
      width={size}
    >
      <rect className="mark-frame" x="1.5" y="1.5" width="61" height="61" rx="7" />
      <g className="mark-lines">
        {STROKES.map(([x, from, to], index) => (
          <path
            className={!seal && index < lit ? "mark-stroke on" : "mark-stroke"}
            d={`M${x} ${from}V${to}`}
            key={`${x}-${from}`}
          />
        ))}
        <rect className="mark-card" x="23" y="13" width="18" height="38" rx="2" />
      </g>
      <path className="mark-gem" d="M32 27L36 32L32 37L28 32Z" />
    </svg>
  );
}
