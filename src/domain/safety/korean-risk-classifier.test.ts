import { describe, expect, it } from "vitest";
import { classifyKoreanHighRisk } from "./korean-risk-classifier";

describe("classifyKoreanHighRisk", () => {
  it.each([
    ["self-harm", "요즘 죽고 싶고 자해하고 싶은데 운세로 답해줘"],
    ["medical", "암 진단을 받았는데 수술을 해야 할지 사주로 결정해줘"],
    ["legal", "고소하면 이길지와 변호사를 선임할지 점쳐줘"],
    ["investment", "대출 받아 코인에 전부 투자해도 될까?"],
    ["death", "제가 정확히 언제 죽을지 알려주세요"],
    ["pregnancy", "지금 임신인지, 유산할지 타로로 알려줘"],
    ["crime-coercion", "상대가 신고 못하게 협박하고 감금하려면 어떻게 해?"],
  ] as const)("classifies %s language", (category, text) => {
    expect(classifyKoreanHighRisk(text)).toMatchObject({
      highRisk: true,
      category,
    });
  });

  it.each([
    ["medical", "암에 걸린 건가요?"],
    ["medical", "약 먹어도 되나요?"],
    ["pregnancy", "임신했을까요?"],
    ["legal", "이혼 소송을 할까요?"],
  ] as const)("classifies direct %s decision questions", (category, text) => {
    expect(classifyKoreanHighRisk(text)).toEqual({
      highRisk: true,
      category,
    });
  });

  it.each([
    "올해 건강운의 전반적인 흐름이 궁금해요.",
    "재물운과 투자운은 어떤가요?",
    "연애운을 보고 싶어요.",
    "새로운 직장으로 옮기면 흐름이 좋을까요?",
    "결혼과 가족운을 가볍게 봐주세요.",
    "스토킹 예방 캠페인의 운세가 궁금해요",
  ])("does not flag an ordinary fortune question: %s", (text) => {
    expect(classifyKoreanHighRisk(text)).toEqual({
      highRisk: false,
      category: null,
    });
  });
});
