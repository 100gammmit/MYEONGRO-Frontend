import { describe, expect, it } from "vitest";

import { parseDeclinedReadingView } from "./declined-result";

function declinedReading() {
  return {
    id: "reading-1",
    kind: "tarot",
    schemaVersion: 1,
    status: "completed",
    input: { question: "전 재산을 투자할까요?" },
    result: {
      resultType: "declined",
      reasonCode: "FINANCIAL_DECISION",
      title: "큰 재정 결정을 리딩으로 정해 드리기는 어려워요",
      message: "객관적인 정보와 전문가의 도움을 함께 확인해 주세요.",
      guidance: ["놓치고 있는 관점을 묻는 방식으로 질문을 바꿔보세요."],
      disclaimer: "전문적인 금융 조언을 대신하지 않습니다.",
    },
  };
}

describe("parseDeclinedReadingView", () => {
  it("accepts a completed tarot or saju decline result", () => {
    expect(parseDeclinedReadingView(declinedReading())?.result.reasonCode)
      .toBe("FINANCIAL_DECISION");
    expect(parseDeclinedReadingView({ ...declinedReading(), kind: "saju" }))
      .not.toBeNull();
  });

  it("rejects unknown reasons, failed records, and malformed copy", () => {
    expect(parseDeclinedReadingView({
      ...declinedReading(),
      result: { ...declinedReading().result, reasonCode: "UNKNOWN" },
    })).toBeNull();
    expect(parseDeclinedReadingView({ ...declinedReading(), status: "failed" }))
      .toBeNull();
    expect(parseDeclinedReadingView({
      ...declinedReading(),
      result: { ...declinedReading().result, guidance: [] },
    })).toBeNull();
  });

  it("rejects a decline when it does not match the expected result kind", () => {
    expect(parseDeclinedReadingView(declinedReading(), "tarot")).not.toBeNull();
    expect(parseDeclinedReadingView(declinedReading(), "saju")).toBeNull();
  });
});
