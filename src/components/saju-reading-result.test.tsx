import { fireEvent, render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import {
  clearRememberedSajuBirthProfile,
  takeRememberedSajuBirthProfile,
} from "@/domain/saju/draft-session";
import { sajuReadingView } from "@/test-fixtures/saju-reading";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { SajuReadingResult } from "./saju-reading-result";

describe("SajuReadingResult", () => {
  beforeEach(() => {
    push.mockReset();
    clearRememberedSajuBirthProfile();
  });

  it("renders summary-first navigation, confirmed pillars, evidence, and limitations", () => {
    render(<SajuReadingResult view={sajuReadingView()} />);

    expect(screen.getByRole("heading", { name: "변화를 준비하며 기준을 세우는 해" })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "사주 리딩 목차" })).toBeInTheDocument();
    const pillarGrid = document.querySelector(".saju-pillar-grid");
    expect(pillarGrid).not.toBeNull();
    expect(within(pillarGrid as HTMLElement).getByText("연주")).toBeInTheDocument();
    expect(within(pillarGrid as HTMLElement).queryByText("시주")).not.toBeInTheDocument();
    expect(screen.getByText("출생 시각 미상")).toBeInTheDocument();
    expect(screen.queryByText("출생지 기준")).not.toBeInTheDocument();
    expect(screen.getAllByText("이 해석에 사용한 계산 근거")).toHaveLength(6);
  });

  it("keeps the mobile document order from summary through guidance and limitations", () => {
    const { container } = render(<SajuReadingResult view={sajuReadingView()} />);
    const ids = Array.from(container.querySelectorAll("[id^='saju-']")).map((element) => element.id);

    expect(ids).toEqual([
      "saju-calculation",
      "saju-core",
      "saju-strengths",
      "saju-relationship",
      "saju-work",
      "saju-annual",
      "saju-question",
      "saju-guidance",
      "saju-limitations",
    ]);
  });

  it("moves only the birth profile through session memory for a new question", () => {
    render(<SajuReadingResult view={sajuReadingView()} />);

    fireEvent.click(screen.getByRole("button", { name: "같은 출생정보로 새 질문" }));

    expect(push).toHaveBeenCalledWith("/saju");
    expect(takeRememberedSajuBirthProfile()).toEqual({
      calendarType: "solar",
      birthDate: "1992-08-17",
      birthTimePrecision: "unknown",
      luckDirectionBasis: "unspecified",
    });
    expect(takeRememberedSajuBirthProfile()).toBeNull();
  });

  it("explains when the question is read through a different fortune area than the selected focus", () => {
    const view = sajuReadingView();
    view.result.readingMode = "health_fortune";
    render(<SajuReadingResult view={view} />);

    expect(screen.getByText("일·진로를 관심 분야로 선택했지만, 질문 내용에 맞춰 건강운으로 읽었어요."))
      .toBeInTheDocument();
    expect(screen.getByText("AI SAJU · 건강운")).toBeInTheDocument();
    expect(screen.queryByText("AI SAJU · 일·진로")).not.toBeInTheDocument();
    expect(document.querySelector("blockquote")).not.toBeInTheDocument();
  });

  it("puts the redirect notice above the reading title", () => {
    const view = sajuReadingView();
    view.result.readingMode = "health_fortune";
    render(<SajuReadingResult view={view} />);

    const notice = screen.getByRole("note");
    expect(notice).toHaveTextContent("건강운을 중심으로 읽었어요");
    const title = screen.getByRole("heading", { level: 1 });
    expect(notice.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("explains a redirected decision even when the resulting mode matches the selected focus", () => {
    const view = sajuReadingView();
    view.result.readingMode = "career_life_fortune";
    view.result.questionRedirected = true;
    render(<SajuReadingResult view={view} />);

    const notice = screen.getByRole("note");
    expect(notice).toHaveTextContent("질문 대신 직업·생활운을 읽었어요");
    expect(notice).toHaveTextContent("중대한 결정이 걸린 질문은 명로가 대신 답할 수 없어요.");
  });

  it("does not show a redirect notice for an explicit fortune request matching the selected focus", () => {
    const view = sajuReadingView();
    view.input.focusArea = "life_money";
    view.result.readingMode = "money_fortune";
    view.result.questionRedirected = false;
    render(<SajuReadingResult view={view} />);

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(screen.getByText("AI SAJU · 금전운")).toBeInTheDocument();
  });

  it("shows no redirect notice for a standard saju reading", () => {
    render(<SajuReadingResult view={sajuReadingView()} />);

    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
