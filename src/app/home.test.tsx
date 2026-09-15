import { render, screen, within } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("offers tarot and saju as two equal gold starts over the sky", () => {
    const { container } = render(<HomePage />);

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
    const tarot = screen.getByRole("link", { name: "타로로 시작" });
    const saju = screen.getByRole("link", { name: "사주로 시작" });
    expect(tarot).toHaveAttribute("href", "/tarot");
    expect(saju).toHaveAttribute("href", "/saju");
    expect(tarot).toHaveClass("primary-button");
    expect(saju).toHaveClass("primary-button");
    expect(container.querySelector(".landing-sky")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelectorAll(".landing-sky svg")).toHaveLength(2);
  });

  it("opens a free daily fortune entry right under the hero", () => {
    render(<HomePage />);

    const band = screen.getByRole("region", { name: "오늘의 운세는 로그인 없이 무료예요" });
    expect(within(band).getByText("카드 한 장으로 오늘의 흐름을 가볍게 살펴보세요."))
      .toBeInTheDocument();
    expect(within(band).getByRole("link", { name: /오늘의 운세 보기/ }))
      .toHaveAttribute("href", "/tarot/daily");
  });

  it("keeps the section order from the design", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent))
      .toEqual([
        "오늘의 운세는 로그인 없이 무료예요",
        "리딩 예시",
        "지금 무엇을 살펴보고 싶나요?",
        "세 단계로 만나는 나의 리딩",
        "오늘은 어떤 마음인가요?",
      ]);
  });

  it("frames both reading paths under one subtitle with gold outline actions", () => {
    render(<HomePage />);

    expect(screen.getByText("타로는 지금을, 사주는 흐름을 봅니다.")).toBeInTheDocument();
    expect(screen.getByText("이번 주나 이번 달처럼 가까운 고민에 생각할 실마리를 건네요."))
      .toBeInTheDocument();
    expect(screen.getByText("타고난 성향과 올해의 큰 흐름을 넓게 살펴봐요."))
      .toBeInTheDocument();
    expect(screen.getByText("로그인 없이 보는 무료 오늘의 운세")).toBeInTheDocument();
    expect(screen.getByText("질문과 함께 진행하는 AI 3장 · 5장 리딩")).toBeInTheDocument();
    expect(screen.getByText("현재 양력 생일만 지원")).toBeInTheDocument();
    const tarot = screen.getByRole("link", { name: "타로 리딩 시작" });
    const saju = screen.getByRole("link", { name: "사주 리딩 시작" });
    expect(tarot).toHaveAttribute("href", "/tarot");
    expect(saju).toHaveAttribute("href", "/saju");
    expect(tarot).toHaveClass("outline-cta");
    expect(saju).toHaveClass("outline-cta");
  });

  it("explains the service flow and closes on the free daily fortune", () => {
    render(<HomePage />);

    expect(screen.getByRole("heading", { name: "질문을 남겨요" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "카드 또는 정보를 선택해요" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "나만의 해석을 읽어요" })).toBeInTheDocument();
    expect(screen.getByText("AI 타로·사주는 해석을 읽고 완료한 기록을 다시 확인합니다."))
      .toBeInTheDocument();
    const closing = screen.getByRole("region", { name: "오늘은 어떤 마음인가요?" });
    expect(within(closing).getByRole("link", { name: "무료로 오늘의 운세 보기" }))
      .toHaveAttribute("href", "/tarot/daily");
  });
});
