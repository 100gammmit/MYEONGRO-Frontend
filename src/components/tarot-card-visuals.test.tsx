import { existsSync } from "node:fs";
import { join } from "node:path";

import { render } from "@testing-library/react";

import { MAJOR_ARCANA } from "@/domain/tarot";

import { TarotCardCaption, TarotCardFace, tarotCardImageSrc } from "./tarot-card-face";
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
  it("fills the card with the pre-cut front and leaves naming to the caption", () => {
    const { container } = render(<TarotCardFace cardId="major-18-moon" />);

    const image = container.querySelector(".card-face img");
    expect(image).toHaveAttribute("src", "/images/tarot/major-arcana/major-18-moon-480.webp");
    expect(image).toHaveAttribute("alt", "");
  });

  it("keeps the empty face for an id it cannot read", () => {
    const { container } = render(<TarotCardFace cardId="major-99-unknown" />);

    expect(container.querySelector(".card-face")).toBeInTheDocument();
    expect(container.querySelector(".card-face img")).toBeNull();
    expect(tarotCardImageSrc("major-99-unknown")).toBeNull();
  });

  it("ships a front image for every major arcana card", () => {
    for (const card of MAJOR_ARCANA) {
      const src = tarotCardImageSrc(card.id);
      expect(src, card.id).not.toBeNull();
      expect(existsSync(join(process.cwd(), "public", src ?? "")), `${src} is missing`).toBe(true);
    }
  });
});

describe("TarotCardCaption", () => {
  it("prints the arcana number before the name and hides the numeral from screen readers", () => {
    const moon = MAJOR_ARCANA.find((card) => card.id === "major-18-moon");
    const { container } = render(<TarotCardCaption cardId="major-18-moon" name={moon?.name ?? "달"} />);

    const caption = container.querySelector(".tarot-card-caption");
    expect(caption).toHaveTextContent(`XVIII · ${moon?.name ?? "달"}`);
    expect(caption?.querySelector(".tarot-card-number")).toHaveAttribute("aria-hidden", "true");
  });

  it("names the fool with its zero", () => {
    const { container } = render(<TarotCardCaption cardId="major-00-fool" name="바보" />);

    expect(container.querySelector(".tarot-card-caption")).toHaveTextContent("0 · 바보");
  });

  it("leaves the number out for an id it cannot read", () => {
    const { container } = render(<TarotCardCaption cardId="" name="카드" />);

    expect(container.querySelector(".tarot-card-number")).toBeNull();
    expect(container.querySelector(".tarot-card-caption")).toHaveTextContent("카드");
  });
});
