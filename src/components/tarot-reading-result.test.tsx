import { fireEvent, render, screen } from "@testing-library/react";

import { MAJOR_ARCANA, TAROT_SPREADS } from "@/domain/tarot";

import { TarotReadingResult } from "./tarot-reading-result";

describe("TarotReadingResult", () => {
  it("reveals the persisted result and links a new reading to the tarot entry route", () => {
    const definition = TAROT_SPREADS.daily_one_card;
    render(
      <TarotReadingResult
        cardIds={[MAJOR_ARCANA[0].id]}
        result={{
          title: "오늘의 리딩",
          summary: "오늘의 흐름을 확인했어요.",
          sections: [{
            position: definition.positions[0].id,
            heading: "오늘의 흐름",
            body: "천천히 살펴보세요.",
          }],
          guidance: ["작은 행동을 시작하세요."],
          disclaimer: "자기 성찰을 위한 참고 정보입니다.",
        }}
        spreadType="daily_one_card"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "첫 카드 공개" }));

    expect(screen.getByText("오늘의 리딩")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새로운 리딩 시작" }))
      .toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "내 기록 보기" }))
      .toHaveAttribute("href", "/records");
  });
});
