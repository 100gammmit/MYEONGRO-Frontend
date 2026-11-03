import type { SajuCalculationSnapshot } from "./result";

export const ELEMENTS = {
  wood: { label: "목 · 나무", description: "자라나고 뻗어가는 나무의 모습에 빗대어 설명하는 분류입니다." },
  fire: { label: "화 · 불", description: "빛과 열을 내는 불의 모습에 빗대어 설명하는 분류입니다." },
  earth: { label: "토 · 흙", description: "받치고 담아내는 흙의 모습에 빗대어 설명하는 분류입니다." },
  metal: { label: "금 · 쇠", description: "단단하고 형태를 갖춘 쇠의 모습에 빗대어 설명하는 분류입니다." },
  water: { label: "수 · 물", description: "흐르고 스며드는 물의 모습에 빗대어 설명하는 분류입니다." },
} as const;
export type Element = keyof typeof ELEMENTS;
export const PILLARS = { year: "연주", month: "월주", day: "일주", time: "시주" } as const;
export type PillarKey = keyof typeof PILLARS;
export type Character = { id: string; pillar: PillarKey; lane: "stem" | "branch"; symbol: string; element?: Element };

// Same stem/branch assignments as Backend LunarJavaFourPillarsAdapter.ELEMENTS.
// Keep the two lanes separate: Korean 신 means either 辛 (stem) or 申 (branch).
const STEMS = ["갑甲wood", "을乙wood", "병丙fire", "정丁fire", "무戊earth", "기己earth", "경庚metal", "신辛metal", "임壬water", "계癸water"];
const BRANCHES = ["자子water", "축丑earth", "인寅wood", "묘卯wood", "진辰earth", "사巳fire", "오午fire", "미未earth", "신申metal", "유酉metal", "술戌earth", "해亥water"];
function dictionary(entries: string[]) {
  return Object.fromEntries(entries.flatMap((entry) => {
    const [korean, hanja] = Array.from(entry);
    const value = { korean, element: entry.slice(2) as Element };
    return [[korean, value], [hanja, value]];
  }));
}
const DICTIONARIES = { stem: dictionary(STEMS), branch: dictionary(BRANCHES) };
export function symbolInfo(symbol: string, lane: Character["lane"]) {
  return Object.prototype.hasOwnProperty.call(DICTIONARIES[lane], symbol)
    ? DICTIONARIES[lane][symbol] : undefined;
}
export function characters(snapshot: SajuCalculationSnapshot): Character[] {
  return (Object.keys(PILLARS) as PillarKey[]).flatMap((pillar) => {
    const value = snapshot.pillars[pillar];
    if (!value) return [];
    const symbols = Array.from(value.ganZhi);
    if (symbols.length !== 2) return [];
    return (["stem", "branch"] as const).map((lane, index) => ({
      id: `${pillar}-${lane}`, pillar, lane, symbol: symbols[index],
      element: symbolInfo(symbols[index], lane)?.element,
    }));
  });
}
export const RELATIONS: Record<string, { label: string; description: string; lane: Character["lane"] }> = {
  stem_combination: { label: "천간의 합 · 위 글자의 연결", description: "위 글자 사이의 결합을 살피는 전통적인 관계입니다. 좋은 관계나 결과를 보장하는 뜻은 아닙니다.", lane: "stem" },
  stem_clash: { label: "천간의 충 · 위 글자의 대립", description: "위 글자 사이의 대립을 살피는 관계입니다. 실제 갈등이나 나쁜 일이 생긴다는 예고는 아닙니다.", lane: "stem" },
  branch_combination: { label: "지지의 합 · 아래 글자의 연결", description: "아래 글자 사이의 결합을 살피는 관계입니다. 다른 명식 요소와 함께 해석합니다.", lane: "branch" },
  branch_clash: { label: "지지의 충 · 아래 글자의 대립", description: "아래 글자 사이의 대립을 살피는 관계입니다. 변화나 긴장을 읽는 재료이지 사건의 예고는 아닙니다.", lane: "branch" },
  branch_harm: { label: "지지의 해 · 아래 글자의 어긋남", description: "아래 글자 사이의 어긋남을 살피는 관계입니다. 누군가에게 해를 입는다는 뜻으로 단정하지 않습니다.", lane: "branch" },
  branch_break: { label: "지지의 파 · 아래 글자의 균열", description: "아래 글자 사이의 균열을 살피는 관계입니다. 실제 관계가 깨진다는 예언은 아닙니다.", lane: "branch" },
  branch_punishment: { label: "지지의 형 · 아래 글자의 마찰", description: "아래 글자 사이의 마찰을 살피는 관계입니다. 처벌이나 사고를 뜻하는 말로 받아들이지 않아도 됩니다.", lane: "branch" },
};

export function relationInfo(type: string) {
  return Object.prototype.hasOwnProperty.call(RELATIONS, type) ? RELATIONS[type] : undefined;
}

// Snapshot relations have symbols but no pillar positions. Highlight only when
// every member has exactly the required number of occurrences in its own lane.
export function relationCharacterIds(snapshot: SajuCalculationSnapshot, relation: SajuCalculationSnapshot["relations"][number]): string[] {
  const definition = relationInfo(relation.type);
  if (!definition || relation.members.length < 2) return [];
  const members = relation.members.map((symbol) => symbolInfo(symbol, definition.lane)?.korean);
  if (members.some((member) => !member)) return [];
  const available = characters(snapshot).filter((character) => character.lane === definition.lane);
  const result: string[] = [];
  for (const member of new Set(members)) {
    const matches = available.filter((character) => symbolInfo(character.symbol, character.lane)?.korean === member);
    if (matches.length !== members.filter((value) => value === member).length) return [];
    result.push(...matches.map((character) => character.id));
  }
  return result;
}
