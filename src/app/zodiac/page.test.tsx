import { render, screen, within } from "@testing-library/react";

import ZodiacHubPage, { metadata } from "./page";

describe("ZodiacHubPage", () => {
  it("introduces the year and links every sign from its card", () => {
    render(<ZodiacHubPage />);

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("2027년 띠별 신년운세");
    const cards = screen.getByRole("list", { name: "띠별 2027년 글" });
    const links = within(cards).getAllByRole("link");
    expect(links).toHaveLength(12);
    expect(links[0]).toHaveAttribute("href", "/zodiac/rat");
    expect(within(cards).getByRole("link", { name: /범띠/ })).toHaveAttribute("href", "/zodiac/tiger");
    expect(within(cards).getByRole("link", { name: /쥐띠/ })).toHaveTextContent("원진·해");
    expect(screen.getByRole("img", { name: /열두 띠를 원으로/ })).toBeInTheDocument();
    expect(screen.getByText("이 내용은 오락과 자기 성찰을 위한 것으로 전문적인 조언을 대신하지 않아요.")).toBeInTheDocument();
  });

  it("offers the year finder without a contents list", () => {
    render(<ZodiacHubPage />);

    expect(screen.getByRole("heading", { name: "내 띠 찾기" })).toBeInTheDocument();
    expect(screen.getByLabelText("태어난 해")).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "가이드 목차" })).not.toBeInTheDocument();
  });

  it("registers its canonical path", () => {
    expect(metadata.alternates?.canonical).toBe("/zodiac");
    expect(metadata.title).toBe("2027 띠별 신년운세: 열두 띠와 정미년 | 명로");
    expect(metadata.openGraph?.images).toEqual([{ url: "/zodiac/opengraph-image", width: 1200, height: 630, alt: "2027 띠별 신년운세" }]);
  });
});
