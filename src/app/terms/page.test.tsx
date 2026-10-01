import { render, screen } from "@testing-library/react";

import TermsPage from "./page";

describe("TermsPage", () => {
  it("states the reading purpose and credit behavior", () => {
    render(<TermsPage />);

    expect(screen.getByRole("heading", { name: "서비스 이용약관" })).toBeInTheDocument();
    expect(screen.getByText(/문서 버전 2026-09-27/)).toBeInTheDocument();
    expect(screen.getByText(/자기 성찰과 오락을 위한 참고 정보/)).toBeInTheDocument();
    expect(screen.getByText(/무료 크레딧은 한국시간을 기준으로 매일 초기화/))
      .toBeInTheDocument();
    expect(screen.getByText(/현금 가치가 없고 환급·양도·이월할 수 없습니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/회원 가입과 AI 리딩은 만 19세 이상만 이용/))
      .toBeInTheDocument();
    expect(screen.getByText(/고의·중과실로 인한 손해와 법령상 배제하거나 제한할 수 없는/))
      .toBeInTheDocument();
    expect(screen.getByText(/민사소송법상 관할법원/)).toBeInTheDocument();
  });
});
