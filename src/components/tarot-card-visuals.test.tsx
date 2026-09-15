import { render } from "@testing-library/react";

import { MAJOR_ARCANA } from "@/domain/tarot";

import { TarotCardFace } from "./tarot-card-face";
import { stoneForSlot, TAROT_STONES, TarotStone } from "./tarot-stone";

describe("TarotStone", () => {
  it("gives the five draw slots the five stones in order", () => {
    expect([1, 2, 3, 4, 5].map(stoneForSlot)).toEqual([...TAROT_STONES]);
  });

  it("draws a stone as hidden decoration from its layer list", () => {
    const { container } = render(<TarotStone kind="ruby" />);

    const stone = container.querySelector(".tarot-stone");
    expect(stone).toHaveAttribute("aria-hidden", "true");
    expect(stone).toHaveClass("stone-ruby", "stone-brilliant");
    expect(stone?.querySelectorAll("i")).toHaveLength(16);
  });
});

describe("TarotCardFace", () => {
  it("prints the arcana number in Roman numerals above the name", () => {
    const moon = MAJOR_ARCANA.find((card) => card.id === "major-18-moon");
    const { container } = render(<TarotCardFace cardId="major-18-moon" name={moon?.name ?? "달"} />);

    expect(container.querySelector(".face-number")).toHaveTextContent("XVIII");
    expect(container.querySelector(".face-name")).toHaveTextContent(moon?.name ?? "달");
  });

  it("sizes the name by its length, from one syllable to the wheel of fortune", () => {
    const short = render(<TarotCardFace cardId="major-18-moon" name="달" />);
    expect(short.container.querySelector(".card-face")).toHaveClass("short");

    const long = render(<TarotCardFace cardId="major-10-wheel-of-fortune" name="운명의 수레바퀴" />);
    expect(long.container.querySelector(".card-face")).toHaveClass("long");

    const middle = render(<TarotCardFace cardId="major-01-magician" name="마법사" />);
    expect(middle.container.querySelector(".card-face")).not.toHaveClass("short");
    expect(middle.container.querySelector(".card-face")).not.toHaveClass("long");
  });

  it("leaves the number out for an id it cannot read", () => {
    const { container } = render(<TarotCardFace cardId="" name="카드" />);

    expect(container.querySelector(".face-number")).toBeNull();
  });
});
