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
  });

  it("keeps both reading journeys and explains the service flow", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "타로 리딩 시작" }),
    ).toHaveAttribute("href", "/tarot");
    expect(
      screen.getByRole("link", { name: "사주 리딩 시작" }),
    ).toHaveAttribute("href", "/saju");
    expect(screen.getByText("소셜 로그인 후 시작")).toBeInTheDocument();
    expect(screen.getByText("완료한 리딩 기록 저장")).toBeInTheDocument();
    expect(screen.getByText("선택을 돕는 성찰형 해석")).toBeInTheDocument();
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
