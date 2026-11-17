import {
  ZODIAC_SIGNS,
  ZODIAC_SLUGS,
  getZodiacSign,
  groupWithYear,
  relationTag,
  relationsWithYear,
  type ZodiacRelationKind,
  type ZodiacSlug,
} from "@/domain/zodiac-fortune";

import styles from "./zodiac.module.css";

const CENTER = 200;
const RADIUS = 150;

// Line styles are told apart by dash and weight as well as colour.
export const RELATION_STROKES: Record<"sixHarmony" | "clash" | "resentHarm" | "breaking", { color: string; width: number; dash?: string }> = {
  sixHarmony: { color: "#e8b54a", width: 2.6 },
  clash: { color: "#ef8a7a", width: 2.2 },
  resentHarm: { color: "#ef8a7a", width: 2.2, dash: "9 6" },
  breaking: { color: "#ef8a7a", width: 1.2, dash: "3 5" },
};
export const GROUP_STYLES = {
  threeHarmony: { fill: "rgba(167,158,246,.10)", stroke: "#a79ef6", width: 1.6 },
  punishment: { fill: "none", stroke: "#9ba7c1", width: 1.6, dash: "1 5" },
  seasonGroup: { stroke: "#6fc3b8", width: 2 },
} as const;

function point(slug: ZodiacSlug): [number, number] {
  const angle = ((-90 + 30 * ZODIAC_SLUGS.indexOf(slug)) * Math.PI) / 180;
  return [round(CENTER + RADIUS * Math.cos(angle)), round(CENTER + RADIUS * Math.sin(angle))];
}

/** "와" after a vowel, "과" after a final consonant. */
function withAnd(word: string): string {
  const code = word.charCodeAt(word.length - 1) - 0xac00;
  return code >= 0 && code < 11172 && code % 28 !== 0 ? "과" : "와";
}

function round(value: number): number {
  return Math.round(value * 10) / 10;
}

function strokeFor(kinds: readonly ZodiacRelationKind[]) {
  if (kinds.includes("sixHarmony")) return RELATION_STROKES.sixHarmony;
  if (kinds.includes("clash")) return RELATION_STROKES.clash;
  if (kinds.includes("resentment") || kinds.includes("harm")) return RELATION_STROKES.resentHarm;
  if (kinds.includes("breaking")) return RELATION_STROKES.breaking;
  return null;
}

function Line({ from, to, stroke }: { from: ZodiacSlug; to: ZodiacSlug; stroke: { color: string; width: number; dash?: string } }) {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  return (
    <line
      stroke={stroke.color}
      strokeDasharray={stroke.dash}
      strokeLinecap="round"
      strokeWidth={stroke.width}
      x1={x1}
      x2={x2}
      y1={y1}
      y2={y2}
    />
  );
}

function Polygon({ members, style }: { members: ZodiacSlug[]; style: { fill: string; stroke: string; width: number; dash?: string } }) {
  if (members.length !== 3) return null;
  return (
    <polygon
      fill={style.fill}
      points={members.map((slug) => point(slug).join(",")).join(" ")}
      stroke={style.stroke}
      strokeDasharray={style.dash}
      strokeLinecap="round"
      strokeWidth={style.width}
    />
  );
}

/** Twelve signs on a circle, 자 at the top, with their relations to the year's animal drawn in. */
export function ZodiacWheel({ yearAnimal, focus, yearNumber }: {
  yearAnimal: ZodiacSlug;
  /** A sign page shows only that sign's line; the hub shows every relation. */
  focus?: ZodiacSlug;
  yearNumber: number;
}) {
  const nameOf = (slug: ZodiacSlug) => getZodiacSign(slug)?.shortName ?? "";
  const yearName = nameOf(yearAnimal);
  const others = ZODIAC_SLUGS.filter((slug) => slug !== yearAnimal);
  const described = (focus ? [focus] : others)
    .map((slug) => ({ slug, kinds: relationsWithYear(slug, yearAnimal) }))
    .filter(({ slug, kinds }) => kinds.length > 0 && slug !== yearAnimal);
  const label = !focus
    ? `열두 띠를 원으로 놓고 올해의 띠인 ${yearName}${withAnd(yearName)}의 관계를 선으로 이은 그림. ${described
      .map(({ slug, kinds }) => `${nameOf(slug)}: ${relationTag(kinds)}`)
      .join(", ")}.`
    : focus === yearAnimal
      ? `열두 띠를 원으로 놓은 그림. ${yearName} 자리가 올해의 띠예요.`
      : described.length
        ? `열두 띠를 원으로 놓은 그림. ${nameOf(focus)} 자리와 올해의 ${yearName} 자리 사이: ${relationTag(described[0].kinds)}.`
        : `열두 띠를 원으로 놓은 그림. ${nameOf(focus)} 자리는 올해의 ${yearName} 자리와 따로 얽히는 관계가 없어요.`;

  const focusLine = focus && focus !== yearAnimal ? described[0] : undefined;
  const focusStroke = focusLine ? strokeFor(focusLine.kinds) ?? { color: "#a79ef6", width: 2.4, dash: "9 6" } : null;
  const [season0, , season2] = groupWithYear("seasonGroup", yearAnimal);

  return (
    <svg aria-label={label} className={styles.wheel} role="img" viewBox="0 0 400 400">
      <circle cx={CENTER} cy={CENTER} fill="none" r={RADIUS} stroke="rgba(230,235,247,.08)" />
      {focus ? null : (
        <>
          {season0 && season2 ? (
            <path
              d={`M${point(season0).join(" ")} A${RADIUS} ${RADIUS} 0 0 1 ${point(season2).join(" ")}`}
              fill="none"
              stroke={GROUP_STYLES.seasonGroup.stroke}
              strokeOpacity={0.8}
              strokeWidth={GROUP_STYLES.seasonGroup.width}
            />
          ) : null}
          <Polygon members={groupWithYear("threeHarmony", yearAnimal)} style={GROUP_STYLES.threeHarmony} />
          <Polygon members={groupWithYear("punishment", yearAnimal)} style={GROUP_STYLES.punishment} />
          {described.map(({ slug, kinds }) => {
            const stroke = strokeFor(kinds);
            return stroke ? <Line from={yearAnimal} key={slug} stroke={stroke} to={slug} /> : null;
          })}
          <circle cx={CENTER} cy={CENTER} fill="#0d0e13" r={38} />
          <text className={styles.wheelYear} dominantBaseline="middle" textAnchor="middle" x={CENTER} y={194}>{yearName}의 해</text>
          <text className={styles.wheelYearNumber} dominantBaseline="middle" textAnchor="middle" x={CENTER} y={218}>{yearNumber}</text>
        </>
      )}
      {focusLine && focusStroke ? (
        <>
          <Line from={yearAnimal} stroke={focusStroke} to={focusLine.slug} />
          <FocusBadge color={focusStroke.color} from={yearAnimal} text={relationTag(focusLine.kinds).replaceAll("·", " · ")} to={focusLine.slug} />
        </>
      ) : null}
      {ZODIAC_SIGNS.map((sign) => {
        const [x, y] = point(sign.slug);
        const isYear = sign.slug === yearAnimal;
        const isFocus = sign.slug === focus;
        const dim = focus !== undefined && !isYear && !isFocus;
        return (
          <g key={sign.slug} opacity={dim ? 0.4 : 1}>
            <circle
              cx={x}
              cy={y}
              fill={isYear ? "rgba(232,181,74,.16)" : "#11131a"}
              r={24}
              stroke={isYear ? "#e8b54a" : isFocus ? "#c7bffa" : "rgba(230,235,247,.22)"}
              strokeWidth={isYear || isFocus ? 2 : 1}
            />
            <text
              className={sign.shortName.length > 2 ? styles.wheelNameLong : styles.wheelName}
              dominantBaseline="middle"
              fill={isYear ? "#e8b54a" : "#e6ebf7"}
              textAnchor="middle"
              x={x}
              y={y + 1}
            >
              {sign.shortName}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// The badge takes its line's colour so a harmonious relation never reads as a warning.
function FocusBadge({ from, to, text, color }: { from: ZodiacSlug; to: ZodiacSlug; text: string; color: string }) {
  const [x1, y1] = point(from);
  const [x2, y2] = point(to);
  const x = round((x1 + x2) / 2);
  const y = round((y1 + y2) / 2);
  const width = Math.max(64, text.length * 13 + 24);
  return (
    <g>
      <rect fill="#0d0e13" height={30} rx={15} stroke={color} strokeOpacity={0.7} width={width} x={x - width / 2} y={y - 15} />
      <text className={styles.wheelBadge} dominantBaseline="middle" fill={color} textAnchor="middle" x={x} y={y + 1}>{text}</text>
    </g>
  );
}
