import { render, screen } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("offers fast tarot and saju entry from the centered hero", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", {
        level: 1,
        name: "지금, 뭐가 궁금하세요?",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("이 사람과 잘 될까요?")).toBeInTheDocument();
    expect(
      screen.getByText("마음에 머무는 질문을 카드와 사주로 차분히 풀어볼게요."),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "타로로 시작" })).toHaveAttribute(
      "href",
      "/tarot",
    );
    expect(screen.getByRole("link", { name: "사주로 시작" })).toHaveAttribute(
      "href",
      "/saju",
    );
  });

  it("explains why both readings are worth checking", () => {
    render(<HomePage />);

    expect(screen.getByText("타로는 지금을 봐요")).toBeInTheDocument();
    expect(screen.getByText("사주는 흐름을 봐요")).toBeInTheDocument();
    expect(screen.getByText("타고난 성향과 올해의 큰 흐름을 넓게 살펴봐요."))
      .toBeInTheDocument();
    expect(screen.getByText("현재 양력 생일만 지원")).toBeInTheDocument();
  });

  it("keeps both reading journeys and explains the service flow", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "타로 리딩 시작" }),
    ).toHaveAttribute("href", "/tarot");
    expect(screen.getByText("로그인 없이 보는 무료 오늘의 한 장"))
      .toBeInTheDocument();
    expect(screen.getByText("질문을 담아 기록하는 AI 3장 · 5장 리딩"))
      .toBeInTheDocument();
    expect(screen.getByText("AI 타로·사주는 해석을 읽고 완료한 기록을 다시 확인합니다."))
      .toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "사주 리딩 시작" }),
    ).toHaveAttribute("href", "/saju");
    expect(
      screen.getByRole("heading", { name: "질문을 남겨요" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "카드 또는 정보를 선택해요" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "나만의 해석을 읽어요" }),
    ).toBeInTheDocument();
  });
});
