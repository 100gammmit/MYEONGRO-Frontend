import type { FourPillars } from "./types";

const STEM_ELEMENTS: Record<string, string> = {
  甲: "목",
  乙: "목",
  丙: "화",
  丁: "화",
  戊: "토",
  己: "토",
  庚: "금",
  辛: "금",
  壬: "수",
  癸: "수",
};

const ELEMENT_GUIDANCE: Record<string, string> = {
  목: "성장 방향을 세우고 꾸준히 확장하는 힘",
  화: "표현과 추진으로 분위기를 움직이는 힘",
  토: "중심을 잡고 현실적으로 마무리하는 힘",
  금: "기준을 세우고 불필요한 것을 정리하는 힘",
  수: "상황을 읽고 유연하게 흐름을 바꾸는 힘",
};

export function createDemoInterpretation(pillars: FourPillars): string {
  const dayStem = pillars.day.charAt(0);
  const element = STEM_ELEMENTS[dayStem] ?? "오행";
  const guidance = ELEMENT_GUIDANCE[element] ?? "균형을 살피는 힘";
  const hourNote =
    pillars.hour === "미상"
      ? "출생 시간이 없어 시주 해석은 제외했습니다."
      : `시주 ${pillars.hour}는 일상의 선택과 후반 흐름을 보조합니다.`;

  return [
    `[데모 해석] 일주 ${pillars.day}의 중심 기운은 ${element}입니다.`,
    `${guidance}이 강점으로 드러날 수 있습니다.`,
    `연주 ${pillars.year}와 월주 ${pillars.month}는 배경과 사회적 흐름을 함께 보여줍니다.`,
    hourNote,
    "이 결과는 Gregorian MVP 규칙에 따른 오락용 설명이며 전문 명리 상담을 대신하지 않습니다.",
  ].join(" ");
}
