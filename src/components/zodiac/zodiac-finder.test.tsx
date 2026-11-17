import { fireEvent, render, screen, within } from "@testing-library/react";

import { ZODIAC_SIGNS, type ZodiacSlug } from "@/domain/zodiac-fortune";

import { ZodiacFinder } from "./zodiac-finder";

const NAMES = Object.fromEntries(ZODIAC_SIGNS.map((sign) => [sign.slug, sign.name])) as Record<ZodiacSlug, string>;

describe("ZodiacFinder", () => {
  it("shows both signs of a birth year split at its 입춘, linking each page", () => {
    render(<ZodiacFinder lead="안내" signNames={NAMES} />);

    expect(screen.getByRole("button", { name: "띠 찾기" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("태어난 해"), { target: { value: "1996" } });
    fireEvent.click(screen.getByRole("button", { name: "띠 찾기" }));

    const result = screen.getByRole("list", { name: "1996년생의 띠" });
    const rows = within(result).getAllByRole("listitem");
    expect(rows[0]).toHaveTextContent("2월 4일(입춘) 이후 출생");
    expect(within(rows[0]).getByRole("link", { name: "쥐띠" })).toHaveAttribute("href", "/zodiac/rat");
    expect(rows[1]).toHaveTextContent("1월 1일 ~ 2월 3일 출생");
    expect(within(rows[1]).getByRole("link", { name: "돼지띠" })).toHaveAttribute("href", "/zodiac/pig");
    expect(screen.getByText("2월 4일에 태어났다면 태어난 시각에 따라 달라질 수 있어요.")).toBeInTheDocument();
  });

  it("keeps the birth year out of the address and browser storage", () => {
    const before = window.location.href;
    render(<ZodiacFinder lead="안내" signNames={NAMES} />);

    fireEvent.change(screen.getByLabelText("태어난 해"), { target: { value: "1990" } });
    fireEvent.click(screen.getByRole("button", { name: "띠 찾기" }));

    expect(window.location.href).toBe(before);
    expect(window.localStorage.length).toBe(0);
    expect(window.sessionStorage.length).toBe(0);
    for (const link of screen.getAllByRole("link")) {
      expect(link.getAttribute("href")).not.toMatch(/1990/);
    }
  });
});
