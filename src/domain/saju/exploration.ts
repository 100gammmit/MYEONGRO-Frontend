import type { SajuCalculationSnapshot } from "./result";

export const ELEMENTS = {
  wood: { label: "목 · 나무", season: "봄", direction: "동쪽", description: "자라고 위로 뻗어 나가는 성질을 나무에 빗대어 표현합니다." },
  fire: { label: "화 · 불", season: "여름", direction: "남쪽", description: "밖으로 퍼지고 드러나는 성질을 불에 빗대어 표현합니다." },
  earth: { label: "토 · 흙", season: "계절이 바뀌는 사이", direction: "가운데", description: "받치고 이어 주며 조율하는 성질을 흙에 빗대어 표현합니다." },
  metal: { label: "금 · 쇠", season: "가을", direction: "서쪽", description: "거두고 다듬어 정리하는 성질을 쇠에 빗대어 표현합니다." },
  water: { label: "수 · 물", season: "겨울", direction: "북쪽", description: "모으고 깊이 저장하는 성질을 물에 빗대어 표현합니다." },
} as const;
export type Element = keyof typeof ELEMENTS;
export const GENERATES: Record<Element, Element> = {
  wood: "fire", fire: "earth", earth: "metal", metal: "water", water: "wood",
};
export const CONTROLS: Record<Element, Element> = {
  wood: "earth", earth: "water", water: "fire", fire: "metal", metal: "wood",
};
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
  stem_combination: { label: "천간의 합 · 위 글자의 연결", description: "위 글자 두 개가 서로 끌어당겨 묶이는 관계입니다. 서로 다른 성향이 한 방향으로 모이는 모습으로 읽습니다.", lane: "stem" },
  stem_clash: { label: "천간의 충 · 위 글자의 대립", description: "위 글자 두 개가 서로 다른 방향으로 밀어내는 관계입니다. 서로 다른 요구 사이에서 균형을 찾는 모습으로 읽습니다.", lane: "stem" },
  branch_combination: { label: "지지의 합 · 아래 글자의 연결", description: "아래 글자 두 개가 짝을 이루어 묶이는 관계입니다. 생활 속에서 서로 보완하는 흐름으로 읽습니다.", lane: "branch" },
  branch_clash: { label: "지지의 충 · 아래 글자의 대립", description: "아래 글자가 정반대 자리에서 마주 보는 관계입니다. 변화와 움직임이 생기기 쉬운 지점으로 읽습니다.", lane: "branch" },
  branch_harm: { label: "지지의 해 · 아래 글자의 어긋남", description: "아래 글자 사이에 미묘한 어긋남이 있는 관계입니다. 기대와 실제의 차이를 맞추는 지점으로 읽습니다.", lane: "branch" },
  branch_break: { label: "지지의 파 · 아래 글자의 균열", description: "아래 글자 사이에 틈이 생기는 관계입니다. 익숙한 방식을 다시 점검하는 계기로 읽습니다.", lane: "branch" },
  branch_punishment: { label: "지지의 형 · 아래 글자의 마찰", description: "아래 글자 사이에 마찰이 생기는 관계입니다. 같은 일이 되풀이될 때 방식을 조정하는 지점으로 읽습니다.", lane: "branch" },
};

export function relationInfo(type: string) {
  return Object.prototype.hasOwnProperty.call(RELATIONS, type) ? RELATIONS[type] : undefined;
}

export function pairedRelations(
  snapshot: SajuCalculationSnapshot,
  relation: SajuCalculationSnapshot["relations"][number],
) {
  const definition = relationInfo(relation.type);
  if (!definition || relation.members.length < 2) return [];
  const normalizedMembers = (members: string[]) => {
    const normalized = members.map((member) => symbolInfo(member, definition.lane)?.korean);
    return normalized.every((member) => member !== undefined)
      ? normalized.sort().join("|") : undefined;
  };
  const members = normalizedMembers(relation.members);
  if (!members) return [];
  return snapshot.relations.filter((other) => other.type !== relation.type
    && relationInfo(other.type)?.lane === definition.lane
    && normalizedMembers(other.members) === members);
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
