import { render, screen, within } from "@testing-library/react";

import AboutPage, { metadata } from "./page";
import { LEGAL_METADATA } from "@/domain/consent/legal-metadata";

describe("AboutPage", () => {
  it("introduces the service and separates general contact from privacy rights without a public operator name", () => {
    const { container } = render(<AboutPage />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "명로 소개" })).toBeInTheDocument();
    const contact = screen.getByRole("region", { name: "운영과 문의" });
    expect(within(contact).getByRole("link", { name: LEGAL_METADATA.contactEmail })).toHaveAttribute("href", `mailto:${LEGAL_METADATA.contactEmail}`);
    expect(within(contact).getByRole("link", { name: LEGAL_METADATA.privacyEmail })).toHaveAttribute("href", `mailto:${LEGAL_METADATA.privacyEmail}`);
    expect(within(contact).getByRole("link", { name: "개인정보 처리방침" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("region", { name: "콘텐츠를 만드는 방식" })).toBeInTheDocument();
    expect(container).not.toHaveTextContent(LEGAL_METADATA.operatorName);
  });
  it("explains how readings are structured without claiming superiority", () => {
    render(<AboutPage />);

    expect(screen.getByText(/어느 쪽이 낫다는 비교가 아니라 결과를 만드는 구조의 차이입니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/특정 운세로 바꿔 읽은 이유를 안내하고.*다룰 수 없는 질문은 따로 알려드립니다/))
      .toBeInTheDocument();
  });

  it("compares each aspect as Myeongro and chatbot pairs instead of a sideways-scrolling table", () => {
    const { container } = render(<AboutPage />);

    const comparison = screen.getByRole("list", { name: "명로와 AI 챗봇 대화 비교" });
    const items = within(comparison).getAllByRole("listitem");
    expect(items.map((item) => within(item).getByRole("heading", { level: 3 }).textContent))
      .toEqual(["시작 방식", "타로", "사주", "질문과 결과"]);
    items.forEach((item) => {
      expect([...item.querySelectorAll("dt")].map((term) => term.textContent)).toEqual(["명로", "AI 챗봇 대화"]);
    });
    expect(container.querySelector("table")).toBeNull();
  });

  it("drops the section labels and arrow glyphs", () => {
    const { container } = render(<AboutPage />);

    expect(container.querySelector(".eyebrow")).toBeNull();
    expect(container).not.toHaveTextContent("→");
    expect(screen.getByRole("link", { name: "타로 리딩 살펴보기" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "사주 리딩 살펴보기" })).toHaveAttribute("href", "/saju");
  });

  it("keeps step numbers out of the spoken list text", () => {
    const { container } = render(<AboutPage />);

    const numbers = container.querySelectorAll("li > span");
    expect(numbers).toHaveLength(6);
    numbers.forEach((number) => expect(number).toHaveAttribute("aria-hidden", "true"));
  });

  it("links to both readings and the free entry", () => {
    render(<AboutPage />);

    expect(screen.getByRole("link", { name: "타로로 시작" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "사주로 시작" })).toHaveAttribute("href", "/saju");
    expect(screen.getByRole("link", { name: "로그인 없이 오늘의 운세 보기" }))
      .toHaveAttribute("href", "/tarot/daily");
  });

  it("provides page-specific metadata", () => {
    expect(metadata.title).toBe("명로 소개 | AI 타로·사주");
    expect(metadata.alternates?.canonical).toBe("/about");
  });
});
