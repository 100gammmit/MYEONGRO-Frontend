import { render, screen, within } from "@testing-library/react";

import ReadingMethodPage, { metadata } from "./page";

describe("ReadingMethodPage", () => {
  it("explains the structured reading principles without claiming superiority", () => {
    render(<ReadingMethodPage />);

    expect(screen.getByRole("heading", {
      level: 1,
      name: "그냥 AI에게 물어보는 것과 무엇이 다를까요?",
    })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "계산은 정해진 규칙으로" }))
      .toBeInTheDocument();
    expect(screen.getByText(/어느 쪽이 낫다는 비교가 아니라.*구조의 차이를 정리했어요/))
      .toBeInTheDocument();
    expect(screen.getByText(/특정 운세로 바꿔 읽은 이유를 안내하고.*다룰 수 없는 질문은 따로 알려드려요/))
      .toBeInTheDocument();
  });

  it("leaves data handling to the privacy policy instead of repeating it here", () => {
    render(<ReadingMethodPage />);

    expect(screen.queryByText(/데이터베이스/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /개인정보/ })).not.toBeInTheDocument();
  });

  it("puts Myeongro next to the row labels in an accessible comparison table", () => {
    render(<ReadingMethodPage />);

    const comparison = screen.getByRole("region", {
      name: "명로, AI 챗봇 대화, 미리 작성된 운세 비교",
    });
    expect(comparison).toHaveAttribute("tabindex", "0");
    expect(within(comparison).getAllByRole("columnheader").map((header) => header.textContent))
      .toEqual(["구분", "명로", "AI 챗봇 대화", "미리 작성된 운세"]);
    expect(within(comparison).getByRole("rowheader", { name: "사주" }))
      .toBeInTheDocument();
    expect(screen.queryByText(/LLM/)).not.toBeInTheDocument();
  });

  it("keeps step numbers out of the spoken list text", () => {
    const { container } = render(<ReadingMethodPage />);

    const numbers = container.querySelectorAll("li > span");
    expect(numbers).toHaveLength(9);
    numbers.forEach((number) => expect(number).toHaveAttribute("aria-hidden", "true"));
  });

  it("links to both readings and the free entry", () => {
    render(<ReadingMethodPage />);

    expect(screen.getByRole("link", { name: "타로로 시작" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "사주로 시작" })).toHaveAttribute("href", "/saju");
    expect(screen.getByRole("link", { name: "로그인 없이 오늘의 운세 보기" }))
      .toHaveAttribute("href", "/tarot/daily");
  });

  it("provides page-specific metadata", () => {
    expect(metadata.title).toBe("명로가 리딩하는 방식 | AI 타로·사주");
    expect(metadata.description).toMatch(/계산하고 구조화하고 해석하는 방식/);
  });
});
