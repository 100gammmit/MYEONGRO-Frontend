import type { Glyph } from "@/domain/saju-dictionary";

import styles from "./saju-dictionary.module.css";

// The glyphs sit on a ring, the page's own glyph at the top in gold; only related glyphs are lit.
const CENTER = 150;
const RADIUS = 108;

type Tone = "harmony" | "tension";

export interface WheelLine {
  readonly to: number;
  readonly tone: Tone;
  readonly label: string;
  /** "solid", "dashed" or "dotted". */
  readonly stroke?: "solid" | "dashed" | "dotted";
  /** Where along the line the label sits, 0 at the page's glyph. */
  readonly at?: number;
  /** Pulls the label toward the centre, for short lines between neighbours. */
  readonly inward?: number;
}

export interface WheelShape {
  /** Three glyph indexes joined into a light triangle (삼합). */
  readonly triangle?: { readonly members: readonly [number, number, number]; readonly label: string };
  /** Three neighbouring glyphs wrapped by a band along the ring (방합), first to last clockwise. */
  readonly band?: { readonly from: number; readonly to: number; readonly label: string };
}

const TONE_COLOR: Record<Tone, string> = { harmony: "#7fc79a", tension: "#e8a090" };
const DASH: Record<NonNullable<WheelLine["stroke"]>, string | undefined> = { solid: undefined, dashed: "6 4", dotted: "2 4" };

function position(index: number, count: number, self: number, radius = RADIUS): [number, number] {
  // Rotate so the page's own glyph is at the top.
  const angle = ((-90 + ((index - self + count) % count) * (360 / count)) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(angle), CENTER + radius * Math.sin(angle)];
}

function Label({ x, y, text, tone }: { x: number; y: number; text: string; tone: Tone }) {
  const width = 10 + text.length * 12;
  return (
    <g>
      <rect fill="#0d0e13" height="20" rx="10" stroke={TONE_COLOR[tone]} strokeOpacity=".5" width={width} x={x - width / 2} y={y - 10} />
      <text fill={TONE_COLOR[tone]} fontSize="12" fontWeight="600" textAnchor="middle" x={x} y={y + 4.5}>{text}</text>
    </g>
  );
}

/**
 * A ring of glyphs with the page's glyph on top and lines to the glyphs it relates to. The caption under
 * it says the same in words, so the drawing stays an aid.
 */
export function RelationWheel({ glyphs, self, lines, shape, title, caption, label }: {
  glyphs: readonly Glyph[];
  self: number;
  lines: readonly WheelLine[];
  shape?: WheelShape;
  title?: string;
  caption: string;
  label: string;
}) {
  const count = glyphs.length;
  const at = (index: number, radius?: number) => position(index, count, self, radius);
  const related = new Map<number, Tone>();
  for (const line of lines) related.set(line.to, line.tone);
  if (shape?.triangle) shape.triangle.members.forEach((member) => member !== self && related.set(member, "harmony"));
  if (shape?.band) [shape.band.from, (shape.band.from + 1) % count, shape.band.to].forEach((member) => member !== self && related.set(member, "harmony"));
  const [selfX, selfY] = at(self);

  return (
    <figure className={styles.wheel}>
      {title ? <figcaption className={styles.wheelTitle}>{title}</figcaption> : null}
      <svg aria-label={label} className={styles.wheelArt} role="img" viewBox="0 -14 300 314">
        <circle cx={CENTER} cy={CENTER} fill="none" r={RADIUS} stroke="rgba(230,235,247,.07)" />
        {shape?.band ? (() => {
          const [x1, y1] = at(shape.band.from);
          const [x2, y2] = at(shape.band.to);
          return <path d={`M${x1} ${y1} A${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2}`} fill="none" stroke={TONE_COLOR.harmony} strokeLinecap="round" strokeOpacity=".28" strokeWidth="22" />;
        })() : null}
        {shape?.triangle ? (
          <polygon
            fill="rgba(127,199,154,.08)"
            points={shape.triangle.members.map((member) => at(member).join(",")).join(" ")}
            stroke={TONE_COLOR.harmony}
            strokeDasharray="5 4"
            strokeWidth="1.5"
          />
        ) : null}
        {lines.map((line) => {
          const [x, y] = at(line.to);
          return <line key={`${line.to}-${line.label}`} stroke={TONE_COLOR[line.tone]} strokeDasharray={DASH[line.stroke ?? "solid"]} strokeWidth="2" x1={selfX} x2={x} y1={selfY} y2={y} />;
        })}
        {glyphs.map((glyph, index) => {
          const [x, y] = at(index);
          const tone = related.get(index);
          const own = index === self;
          return (
            <g key={glyph.hanja}>
              <circle
                cx={x}
                cy={y}
                fill={own ? "#2b2516" : tone ? "#15161d" : "#111218"}
                r={own ? 19 : tone ? 17 : 16}
                stroke={own ? "#e8b54a" : tone ? TONE_COLOR[tone] : "rgba(230,235,247,.1)"}
                strokeWidth={own ? 2 : tone ? 1.5 : 1}
              />
              <text className={styles[glyph.element]} fill="currentColor" fillOpacity={own || tone ? 1 : 0.35} fontFamily="Noto Serif KR Variable, serif" fontSize="18" textAnchor="middle" x={x} y={y + 6.5}>{glyph.hanja}</text>
            </g>
          );
        })}
        {shape?.band ? <Label text={shape.band.label} tone="harmony" x={CENTER} y={-2} /> : null}
        {shape?.triangle ? (() => {
          const others = shape.triangle.members.filter((member) => member !== self);
          const [ax, ay] = at(others[0]);
          const [bx, by] = at(others[1]);
          return <Label text={shape.triangle.label} tone="harmony" x={(ax + bx) / 2} y={(ay + by) / 2} />;
        })() : null}
        {lines.map((line) => {
          const [x, y] = at(line.to);
          const t = line.at ?? 0.55;
          let lx = selfX + (x - selfX) * t;
          let ly = selfY + (y - selfY) * t;
          if (line.inward) {
            const distance = Math.hypot(lx - CENTER, ly - CENTER) || 1;
            lx -= ((lx - CENTER) / distance) * line.inward;
            ly -= ((ly - CENTER) / distance) * line.inward;
          }
          return <Label key={`label-${line.to}-${line.label}`} text={line.label} tone={line.tone} x={lx} y={ly} />;
        })}
      </svg>
      <p className={styles.wheelCaption}>{caption}</p>
    </figure>
  );
}
