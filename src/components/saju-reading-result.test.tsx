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
      provinceCode: "36",
      cityCode: "36110",
      luckDirectionBasis: "unspecified",
    });
    expect(takeRememberedSajuBirthProfile()).toBeNull();
  });

  it("explains a redirected health fortune without hiding the original question", () => {
    const view = sajuReadingView();
    view.result.readingMode = "health_fortune";
    render(<SajuReadingResult view={view} />);

    expect(screen.getByText("구체적인 의료 결정은 다루지 않고, 지금의 건강운을 중심으로 읽었어요."))
      .toBeInTheDocument();
    expect(screen.getByText(view.input.question)).toBeInTheDocument();
  });
});
