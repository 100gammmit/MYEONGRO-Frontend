import { fireEvent, render, screen, waitFor } from "@testing-library/react";

import { MAJOR_ARCANA, TAROT_SPREADS } from "@/domain/tarot";

import { TarotReadingResult } from "./tarot-reading-result";

describe("TarotReadingResult", () => {
  it("reveals the persisted result and links a new reading to the tarot entry route", () => {
    const definition = TAROT_SPREADS.mind_three_card;
    render(
      <TarotReadingResult
        cardIds={MAJOR_ARCANA.slice(0, 3).map((card) => card.id)}
        result={{
          readingMode: "standard",
          title: "오늘의 리딩",
          summary: "오늘의 흐름을 확인했어요.",
          sections: definition.positions.map((position) => ({
            position: position.id,
            heading: "마음의 흐름",
            body: "천천히 살펴보세요.",
          })),
          guidance: ["작은 행동을 시작하세요."],
          disclaimer: "자기 성찰을 위한 참고 정보입니다.",
        }}
        spreadType="mind_three_card"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "첫 카드 공개" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 카드 공개" }));
    fireEvent.click(screen.getByRole("button", { name: "다음 카드 공개" }));

    expect(screen.getByText("오늘의 리딩")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "새로운 리딩 시작" }))
      .toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "내 기록 보기" }))
      .toHaveAttribute("href", "/records");
  });

  it("turns each revealed card from its back to the typeset front", async () => {
    const definition = TAROT_SPREADS.mind_three_card;
    const { container } = render(
      <TarotReadingResult
        cardIds={MAJOR_ARCANA.slice(0, 3).map((card) => card.id)}
        result={{
          readingMode: "standard",
          title: "오늘의 리딩",
          summary: "오늘의 흐름을 확인했어요.",
          sections: definition.positions.map((position) => ({
            position: position.id,
            heading: "마음의 흐름",
            body: "천천히 살펴보세요.",
          })),
          guidance: ["작은 행동을 시작하세요."],
          disclaimer: "자기 성찰을 위한 참고 정보입니다.",
        }}
        spreadType="mind_three_card"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "첫 카드 공개" }));

    const card = screen.getByLabelText(`${definition.positions[0].label}: ${MAJOR_ARCANA[0].name}`);
    expect(card.querySelector(".card-flip-back")).toHaveAttribute("aria-hidden", "true");
    expect(card.querySelector(".face-number")).toHaveTextContent("0");
    expect(card.querySelector(".face-name")).toHaveTextContent(MAJOR_ARCANA[0].name);
    await waitFor(() => expect(container.querySelector(".card-flip-inner")).toHaveClass("flipped"));
  });

  it("opens a saved record with every card turned and the record's own frame", () => {
    const definition = TAROT_SPREADS.mind_three_card;
    const { container } = render(
      <TarotReadingResult
        cardIds={MAJOR_ARCANA.slice(0, 3).map((card) => card.id)}
        record={{
          backHref: "/records",
          backLabel: "내 기록",
          dateLabel: "2026. 9. 15.",
          footer: <button type="button">기록 삭제</button>,
        }}
        result={{
          readingMode: "standard",
          title: "오늘의 리딩",
          summary: "오늘의 흐름을 확인했어요.",
          sections: definition.positions.map((position) => ({
            position: position.id,
            heading: "마음의 흐름",
            body: "천천히 살펴보세요.",
          })),
          guidance: ["작은 행동을 시작하세요."],
          disclaimer: "자기 성찰을 위한 참고 정보입니다.",
        }}
        spreadType="mind_three_card"
      />,
    );

    expect(screen.queryByRole("button", { name: "첫 카드 공개" })).not.toBeInTheDocument();
    expect(container.querySelectorAll(".card-flip-inner.flipped")).toHaveLength(3);
    expect(screen.getByRole("link", { name: "← 내 기록" })).toHaveAttribute("href", "/records");
    expect(screen.getByText("2026. 9. 15.")).toBeInTheDocument();
    expect(container.querySelector(".progress-track")).toBeNull();
    expect(screen.getByText("오늘의 리딩")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "기록 삭제" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "새로운 리딩 시작" })).not.toBeInTheDocument();
  });

  it("explains a redirected reading above the first card, before anything is revealed", () => {
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

    const notice = screen.getByRole("note");
    expect(notice).toHaveTextContent("금전운으로 바꿔 읽었어요");
    expect(notice).toHaveTextContent("구체적인 재정 결정은 다루지 않고, 지금의 금전운을 중심으로 읽었어요.");
    const reveal = screen.getByRole("button", { name: "첫 카드 공개" });
    expect(notice.compareDocumentPosition(reveal) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("shows no redirect notice for a standard reading", () => {
    const definition = TAROT_SPREADS.mind_three_card;
    render(
      <TarotReadingResult
        cardIds={MAJOR_ARCANA.slice(0, 3).map((card) => card.id)}
        result={{
          readingMode: "standard",
          title: "오늘의 리딩",
          summary: "오늘의 흐름을 확인했어요.",
          sections: definition.positions.map((position) => ({
            position: position.id,
            heading: "마음의 흐름",
            body: "천천히 살펴보세요.",
          })),
          guidance: ["작은 행동을 시작하세요."],
          disclaimer: "자기 성찰을 위한 참고 정보입니다.",
        }}
        spreadType="mind_three_card"
      />,
    );

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
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

  it.each([
    ["mind_three_card", "health_fortune", "현재의 운", "지금의 감정"],
    ["relationship_three_card", "money_fortune", "운의 출발점", "내가 가져온 마음"],
  ] as const)("uses fortune labels for redirected %s readings", (spreadType, readingMode, label, oldLabel) => {
    const definition = TAROT_SPREADS[spreadType];
    render(
      <TarotReadingResult
        cardIds={MAJOR_ARCANA.slice(0, 3).map((card) => card.id)}
        result={{
          readingMode,
          title: "운세의 방향",
          summary: "지금 흐름을 분명하게 읽었어요.",
          sections: definition.positions.map((position) => ({
            position: position.id,
            heading: "흐름",
            body: "카드 해석",
          })),
          guidance: ["오늘 할 수 있는 한 가지를 정하세요."],
          disclaimer: "오락과 자기 성찰을 위한 참고입니다.",
        }}
        spreadType={spreadType}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "첫 카드 공개" }));
    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText(oldLabel)).not.toBeInTheDocument();
  });
});
