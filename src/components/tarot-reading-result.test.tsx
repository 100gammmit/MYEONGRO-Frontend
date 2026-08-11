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
          readingMode: "standard",
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

  it("shows redirected fortune copy and neutral choice labels", () => {
    const definition = TAROT_SPREADS.choice_five_card;
    render(
      <TarotReadingResult
        cardIds={MAJOR_ARCANA.slice(0, 5).map((card) => card.id)}
        result={{
          readingMode: "money_fortune",
          title: "금전운의 방향",
          summary: "지금은 지키는 쪽이 좋아요.",
          sections: definition.positions.map((position) => ({
            position: position.id,
            heading: "흐름",
            body: "카드 해석",
          })),
          guidance: ["지출 한도를 먼저 정해 두세요."],
          disclaimer: "오락과 자기 성찰을 위한 참고입니다.",
        }}
        spreadType="choice_five_card"
      />,
    );

    for (let index = 0; index < 5; index += 1) {
      fireEvent.click(screen.getByRole("button", { name: index === 0 ? "첫 카드 공개" : "다음 카드 공개" }));
    }

    expect(screen.getByText("구체적인 재정 결정은 다루지 않고, 지금의 금전운을 중심으로 읽었어요."))
      .toBeInTheDocument();
    expect(screen.getByText("운을 돕는 요소")).toBeInTheDocument();
    expect(screen.queryByText("선택 A")).not.toBeInTheDocument();
  });
});
