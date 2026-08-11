import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReadingDeclinedResult } from "./reading-declined-result";

describe("ReadingDeclinedResult", () => {
  it("shows fixed guidance and a new-question action without retry UI", () => {
    render(
      <ReadingDeclinedResult
        backHref="/tarot"
        backLabel="타로 리딩"
        view={{
          id: "reading-1",
          kind: "tarot",
          status: "completed",
          input: { question: "전 재산을 투자할까요?" },
          result: {
            resultType: "declined",
            reasonCode: "FINANCIAL_DECISION",
            title: "큰 재정 결정을 리딩으로 정해 드리기는 어려워요",
            message: "객관적인 정보와 전문가의 도움을 함께 확인해 주세요.",
            guidance: ["질문을 자기 점검의 관점으로 바꿔보세요."],
            disclaimer: "전문적인 금융 조언을 대신하지 않습니다.",
          },
        }}
      />,
    );

    expect(screen.getByRole("heading", {
      name: "큰 재정 결정을 리딩으로 정해 드리기는 어려워요",
    })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "질문 바꿔보기" }))
      .toHaveAttribute("href", "/tarot");
    expect(screen.queryByRole("button", { name: "다시 생성" }))
      .not.toBeInTheDocument();
  });
});
