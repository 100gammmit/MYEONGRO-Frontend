import { symbolInfo, type Element } from "@/domain/saju/exploration";

import type { ManseryeokChart, ManseryeokPosition } from "./schema";

/** Charts read right to left in tradition; the screen lists hour, day, month, year left to right. */
export const CHART_COLUMNS: readonly ManseryeokPosition[] = ["time", "day", "month", "year"];
export const POSITION_LABELS: Record<ManseryeokPosition, string> = { time: "시주", day: "일주", month: "월주", year: "연주" };
export const POSITION_SHORT: Record<ManseryeokPosition, string> = { time: "시", day: "일", month: "월", year: "연" };

export const ELEMENT_ORDER: readonly Element[] = ["wood", "fire", "earth", "metal", "water"];
export const ELEMENT_NAMES: Record<Element, string> = { wood: "목", fire: "화", earth: "토", metal: "금", water: "수" };

/** All eleven relation types the backend sends, in its order, with a short plain-language reading. */
export const RELATION_TYPES: ReadonlyArray<{ type: string; label: string; description: string }> = [
  { type: "stem_combination", label: "천간합", description: "위 글자 두 개가 서로 끌어당겨 묶이는 관계예요." },
  { type: "stem_clash", label: "천간충", description: "위 글자 두 개가 서로 다른 방향으로 밀어내는 관계예요." },
  { type: "branch_combination", label: "육합", description: "아래 글자 두 개가 짝을 이뤄 서로 보완하는 관계예요." },
  { type: "branch_clash", label: "충", description: "아래 글자가 정반대 자리에서 마주 보는 관계예요. 변화가 생기기 쉬운 자리로 봐요." },
  { type: "branch_harm", label: "해", description: "아래 글자 사이에 미묘한 어긋남이 있는 관계예요." },
  { type: "branch_break", label: "파", description: "아래 글자 사이에 틈이 생기는 관계예요." },
  { type: "branch_punishment", label: "형", description: "아래 글자 사이에 마찰이 생기는 관계예요." },
  { type: "branch_triple_combination", label: "삼합", description: "아래 글자 세 개가 모여 한 오행의 힘을 이루는 관계예요." },
  { type: "branch_half_combination", label: "반합", description: "삼합을 이루는 세 글자 중 두 글자가 만난 관계예요." },
  { type: "branch_direction_combination", label: "방합", description: "같은 계절·방향의 아래 글자 세 개가 모인 관계예요." },
  { type: "branch_wonjin", label: "원진", description: "서로 끌리면서도 작은 어긋남이 생기기 쉬운 짝으로 보는 관계예요." },
];

export interface Glyph {
  readonly hanja: string;
  readonly korean: string;
  readonly element?: Element;
  /** "+" for yang, "−" for yin. */
  readonly sign?: "+" | "−";
}

/** A stem or branch from a hanja or Korean character; the lane keeps 辛(stem) and 申(branch) apart. */
export function glyph(symbol: string, lane: "stem" | "branch"): Glyph {
  const info = symbolInfo(symbol, lane);
  return info
    ? { hanja: info.hanja, korean: info.korean, element: info.element, sign: info.yang ? "+" : "−" }
    : { hanja: symbol, korean: symbol };
}

/** Luck and month pillars arrive in Korean ("기유"); split them into stem and branch glyphs. */
export function ganZhiGlyphs(value: string): [Glyph, Glyph] | null {
  const chars = Array.from(value);
  return chars.length === 2 ? [glyph(chars[0], "stem"), glyph(chars[1], "branch")] : null;
}

/** The branch's ten god is the one of its main hidden stem, which the backend lists first. */
export function branchTenGod(chart: ManseryeokChart, position: ManseryeokPosition): string | null {
  return chart.hiddenStems[position]?.[0]?.tenGod ?? null;
}

export interface RelationGroup {
  readonly type: string;
  readonly label: string;
  readonly description: string;
  readonly items: ManseryeokChart["relations"]["values"];
}

export function relationGroups(chart: ManseryeokChart): { present: RelationGroup[]; absent: string[] } {
  const present: RelationGroup[] = [];
  const absent: string[] = [];
  for (const kind of RELATION_TYPES) {
    const items = chart.relations.values.filter((relation) => relation.type === kind.type);
    if (items.length) present.push({ ...kind, items });
    else absent.push(kind.label);
  }
  return { present, absent };
}

/** How many cells each element row shows: at least four, more when one element fills more. */
export function elementCellCount(chart: ManseryeokChart): number {
  return Math.min(8, Math.max(4, ...ELEMENT_ORDER.map((element) => chart.fiveElements[element])));
}

/** "1992-08-17T14:30" or "…T14:30:00" → "14:30". */
export function clockOf(localDateTime: string): string {
  const match = /T(\d{2}):(\d{2})/.exec(localDateTime);
  return match ? `${match[1]}:${match[2]}` : localDateTime;
}

function shiftClock(localDateTime: string, minutes: number): string {
  const match = /T(\d{2}):(\d{2})/.exec(localDateTime);
  if (!match) return localDateTime;
  const total = (Number(match[1]) * 60 + Number(match[2]) + minutes + 24 * 60) % (24 * 60);
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export type CorrectedTime =
  | { readonly kind: "exact"; readonly input: string; readonly corrected: string }
  | { readonly kind: "approximate"; readonly input: string; readonly from: string; readonly to: string }
  | { readonly kind: "none" };

/** The input time against the time used after longitude and equation-of-time correction. */
export function correctedTime(chart: ManseryeokChart): CorrectedTime {
  const correction = chart.timeCorrection;
  if (!correction || chart.uncertainty.precision === "unknown") return { kind: "none" };
  if (chart.uncertainty.precision === "approximate") {
    return { kind: "approximate", input: clockOf(correction.civilTime), from: shiftClock(correction.trueSolarTime, -60), to: shiftClock(correction.trueSolarTime, 60) };
  }
  return { kind: "exact", input: clockOf(correction.civilTime), corrected: clockOf(correction.trueSolarTime) };
}

export function signedMinutes(value: number): string {
  const rounded = Math.round(value);
  return `${rounded > 0 ? "+" : rounded < 0 ? "−" : "±"}${Math.abs(rounded)}분`;
}

/** The period of the luck cycle that contains `year`, or -1. */
export function currentLuckIndex(chart: ManseryeokChart, year: number): number {
  return chart.luckCycle?.periods.findIndex((period) => period.startYear <= year && year <= period.endYear) ?? -1;
}

/** "2026-01-05T17:23:00+09:00" → { day: 5, clock: "17:23" } in Korea time, as the calendar is. */
export function termStart(timestamp: string): { day: number; clock: string } {
  const match = /^\d{4}-\d{2}-(\d{2})T(\d{2}):(\d{2})/.exec(timestamp);
  return match ? { day: Number(match[1]), clock: `${match[2]}:${match[3]}` } : { day: 0, clock: "" };
}
