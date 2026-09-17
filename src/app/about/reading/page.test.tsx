import { render, screen, within } from "@testing-library/react";

import ReadingMethodPage, { metadata } from "./page";

describe("ReadingMethodPage", () => {
  it("explains the structured reading principles without claiming superiority", () => {
    render(<ReadingMethodPage />);

    expect(screen.getByRole("heading", {
      level: 1,
      name: "그냥 AI에게 물어보는 것과 무엇이 다른가요?",
    })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "계산은 정해진 규칙으로" }))
      .toBeInTheDocument();
    expect(screen.getByText(/서비스의 우열이 아니라.*구조의 차이를 비교합니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/질문과 선택지 원문은.*명로 데이터베이스에는 저장하지 않습니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/특정 운세로 바꿔 읽은 이유를 안내하거나.*다룰 수 없는 질문은 별도로 안내합니다/))
      .toBeInTheDocument();
  });

  it("compares service types in an accessible table", () => {
    render(<ReadingMethodPage />);

    const comparison = screen.getByRole("region", {
      name: "일반 LLM 대화, 고정형 운세 콘텐츠와 명로 비교",
    });
    expect(comparison).toHaveAttribute("tabindex", "0");
    expect(within(comparison).getByRole("columnheader", { name: "일반 LLM 대화" }))
      .toBeInTheDocument();
    expect(within(comparison).getByRole("columnheader", { name: "고정형 운세 콘텐츠" }))
      .toBeInTheDocument();
    expect(within(comparison).getByRole("columnheader", { name: "명로" }))
      .toBeInTheDocument();
    expect(within(comparison).getByRole("rowheader", { name: "사주" }))
      .toBeInTheDocument();
  });

  it("links to both readings, the free entry, and the privacy policy", () => {
    render(<ReadingMethodPage />);

    expect(screen.getByRole("link", { name: "타로로 시작" })).toHaveAttribute("href", "/tarot");
    expect(screen.getByRole("link", { name: "사주로 시작" })).toHaveAttribute("href", "/saju");
    expect(screen.getByRole("link", { name: "로그인 없이 오늘의 운세 보기" }))
      .toHaveAttribute("href", "/tarot/daily");
    expect(screen.getByRole("link", { name: /개인정보 처리 방식 자세히 보기/ }))
      .toHaveAttribute("href", "/privacy");
  });

  it("provides page-specific metadata", () => {
    expect(metadata.title).toBe("명로가 리딩하는 방식 | AI 타로·사주");
    expect(metadata.description).toMatch(/계산하고 구조화하고 해석하는 방식/);
  });
});
