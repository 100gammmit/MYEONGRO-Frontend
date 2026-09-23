import { render, screen, within } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("describes the available account deletion control", () => {
    render(<PrivacyPage />);

    expect(screen.queryByText(/회원 탈퇴 시 계정 데이터 삭제를 요청/))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/후속 마일스톤/)).not.toBeInTheDocument();
    expect(screen.getByText(/계정 설정에서 계정 삭제를 요청하면.*운영 데이터베이스에서 즉시 영구 삭제되며 복구할 수 없습니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/문서 버전 draft-2026-09-10/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI OpCo, LLC의 Global API/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "개인정보 처리 항목과 보유기간" }))
      .toBeInTheDocument();
    const table = screen.getByRole("table", { name: "명로 개인정보 처리 항목과 보유기간" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent))
      .toEqual(["처리 목적", "처리 항목", "처리 근거", "보유기간·삭제 기준"]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(12);
    expect(within(table).getByRole("row", { name: /사주 계산.*양력 생년월일.*처리 완료 시 폐기/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /AI 리딩 요청 처리.*명로 데이터베이스와 운영 로그에는 저장하지 않음/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /무료 오늘의 운세 이어보기.*SHA-256 계정 범위값.*현재 브라우저/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /서비스 보안과 오류·장애 대응.*리딩 식별자.*최대 30일/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /OpenAI를 통한 AI 리딩 생성.*국외이전 별도 동의.*최대 24시간/ }))
      .toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "개인정보 보호법 제15조 제1항 제4호" }))
      .toHaveLength(9);
    expect(screen.getByRole("link", { name: "개인정보 보호법 제28조의8 제1항 제1호" }))
      .toBeInTheDocument();
  });
});
