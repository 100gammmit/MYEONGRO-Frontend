import { render, screen, within } from "@testing-library/react";
import HomePage from "./page";

describe("HomePage", () => {
  it("opens on one question split into a tarot path and a saju path with equal gold starts", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("heading", { level: 1, name: "지금, 뭐가 궁금하세요?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "AI 타로와 사주로 마음에 머무는 질문을 풀어요. 오늘의 운세는 로그인 없이 무료예요.",
      ),
    ).toBeInTheDocument();

    const tarot = screen.getByRole("heading", { level: 2, name: "AI 타로" }).closest("div.hero-path");
    const saju = screen.getByRole("heading", { level: 2, name: "AI 사주" }).closest("div.hero-path");
    if (!(tarot instanceof HTMLElement) || !(saju instanceof HTMLElement)) {
      throw new Error("hero paths missing");
    }
    expect(within(tarot).getByText("로그인 없이 보는 무료 오늘의 운세")).toBeInTheDocument();
    expect(within(tarot).getByText("질문과 함께 진행하는 AI 3장·5장 리딩")).toBeInTheDocument();
    expect(within(saju).getByText("현재 양력 생일만 지원")).toBeInTheDocument();
    expect(within(saju).getByText("출생 시각의 정확도에 맞춘 해석")).toBeInTheDocument();

    const tarotStart = within(tarot).getByRole("link", { name: "타로로 시작" });
    const sajuStart = within(saju).getByRole("link", { name: "사주로 시작" });
    expect(tarotStart).toHaveAttribute("href", "/tarot");
    expect(sajuStart).toHaveAttribute("href", "/saju");
    expect(tarotStart).toHaveClass("primary-button");
    expect(sajuStart).toHaveClass("primary-button");
  });

  it("keeps the card fan and the sample chart away from assistive technology", () => {
    const { container } = render(<HomePage />);

    expect(container.querySelector(".hero-fan")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".home-saju-chart")).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector(".home-saju-mini")?.closest("[aria-hidden='true']")).not.toBeNull();
  });

  it("opens a free daily fortune entry right under the hero", () => {
    render(<HomePage />);

    const band = screen.getByRole("region", { name: "오늘의 운세는 로그인 없이 무료예요" });
    expect(within(band).getByText("카드 한 장으로 오늘의 흐름을 살펴보세요.")).toBeInTheDocument();
    expect(within(band).getByRole("link", { name: "오늘의 운세 보기" }))
      .toHaveAttribute("href", "/tarot/daily");
  });

  it("quotes a reading line next to the card it came from", () => {
    render(<HomePage />);

    const peek = screen.getByRole("region", { name: "리딩 예시" });
    expect(within(peek).getByText(/세계는 지금 관계가 멀어지는 쪽보다/)).toBeInTheDocument();
    expect(within(peek).getByText("세계")).toBeInTheDocument();
    expect(within(peek).getByText("관계 리딩, 관계의 흐름 자리 해석 중에서")).toBeInTheDocument();
  });

  it("keeps the section order from the design without a separate reading choice", () => {
    render(<HomePage />);

    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent))
      .toEqual([
        "AI 타로",
        "AI 사주",
        "오늘의 운세는 로그인 없이 무료예요",
        "리딩 예시",
        "세 단계로 만나는 나의 리딩",
        "그냥 AI에게 물어보는 것과 무엇이 다를까요?",
        "처음이라면, 여기서 시작하세요",
        "오늘은 어떤 마음인가요?",
      ]);
  });

  it("explains the service flow in order and closes on the free daily fortune", () => {
    render(<HomePage />);

    const steps = within(screen.getByRole("region", { name: "세 단계로 만나는 나의 리딩" }))
      .getAllByRole("listitem");
    expect(steps.map((step) => within(step).getByRole("heading").textContent)).toEqual([
      "질문을 남겨요",
      "카드 또는 정보를 선택해요",
      "나만의 해석을 읽어요",
    ]);
    expect(screen.getByText("해석을 읽고, 완료한 리딩은 기록에서 다시 확인합니다."))
      .toBeInTheDocument();

    const closing = screen.getByRole("region", { name: "오늘은 어떤 마음인가요?" });
    expect(within(closing).getByRole("link", { name: "무료로 오늘의 운세 보기" }))
      .toHaveAttribute("href", "/tarot/daily");
  });

  it("links to the public explanation of how readings are made", () => {
    render(<HomePage />);

    expect(screen.getByText(/타로는 카드의 자리를 정하고.*사주는 명식을 먼저 계산한 뒤 해석해요/))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "명로의 리딩 방식 보기" }))
      .toHaveAttribute("href", "/about#reading-method");
  });
});
