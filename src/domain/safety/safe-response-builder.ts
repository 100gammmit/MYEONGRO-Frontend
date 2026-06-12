import type { ReadingGenerationOutput } from "../generation/contracts";
import type { HighRiskCategory } from "./korean-risk-classifier";

const categoryGuidance: Record<HighRiskCategory, string[]> = {
  "self-harm": [
    "지금 당장 위험하다면 112 또는 119에 연락하거나 가까운 응급실로 가세요.",
    "한국에서는 자살예방상담전화 109에서 24시간 도움을 받을 수 있습니다.",
    "혼자 있지 말고 믿을 수 있는 사람에게 지금의 상황을 알려 주세요.",
  ],
  medical: [
    "증상, 진단, 치료 결정은 의사나 자격 있는 의료 전문가와 상의하세요.",
    "응급 증상이 있으면 119 또는 가까운 응급실의 도움을 받으세요.",
  ],
  legal: [
    "구체적인 권리와 대응 방법은 변호사나 공인된 법률상담 기관에 확인하세요.",
    "기한이 있는 사안이라면 관련 문서와 사실관계를 보존해 신속히 상담하세요.",
  ],
  investment: [
    "손실 가능성, 수수료, 상환 부담을 확인하고 자격 있는 금융 전문가와 상의하세요.",
    "대출이나 생계 자금을 이용한 투자는 피하고 독립적인 정보를 확인하세요.",
  ],
  death: [
    "죽음의 시기나 수명은 운세로 알 수 없으며 확정적으로 예측할 수 없습니다.",
    "죽음에 대한 불안이 일상을 방해한다면 믿을 수 있는 사람이나 전문가와 이야기하세요.",
  ],
  pregnancy: [
    "임신 여부와 임신 관련 위험은 의료 검사와 산부인과 상담으로 확인하세요.",
    "통증이나 출혈 등 긴급한 증상이 있으면 119 또는 응급실의 도움을 받으세요.",
  ],
  "crime-coercion": [
    "범죄나 강요를 실행하거나 숨기는 방법은 제공할 수 없습니다.",
    "위협이나 폭력이 진행 중이면 안전한 장소로 이동해 112에 도움을 요청하세요.",
  ],
};

export function buildSafeResponse(
  category: HighRiskCategory,
): ReadingGenerationOutput {
  return {
    title: "안전을 먼저 확인해 주세요",
    summary:
      "이 질문은 운세로 확정하거나 대신 결정할 수 없는 중요한 안전 문제를 포함하고 있습니다.",
    sections: [
      {
        heading: "도움을 받을 수 있는 방법",
        body: categoryGuidance[category].join(" "),
      },
    ],
    guidance: categoryGuidance[category],
    disclaimer:
      "이 안내는 전문적인 의료, 법률, 금융 또는 긴급 지원을 대신하지 않습니다.",
  };
}
