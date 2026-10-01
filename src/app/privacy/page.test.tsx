import { render, screen, within } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("describes the available account deletion control", () => {
    render(<PrivacyPage />);

    expect(screen.queryByText(/회원 탈퇴 시 계정 데이터 삭제를 요청/))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/후속 마일스톤/)).not.toBeInTheDocument();
    expect(screen.getByText(/계정 설정에서 계정 삭제를 요청하면.*위 삭제·백업 기준에 따라 처리됩니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/운영 데이터베이스에서는 즉시 삭제되며 서비스에서 개별 복구할 수 없습니다.*재해복구용 자동 백업에는 최대 7일간 잔존/))
      .toBeInTheDocument();
    expect(screen.getByText(/문서 버전 2026-10-02/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI OpCo, LLC의 Global API/)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "개인정보 처리 항목과 보유기간" }))
      .toBeInTheDocument();
    const table = screen.getByRole("table", { name: "명로 개인정보 처리 항목과 보유기간" });
    expect(within(table).getAllByRole("columnheader").map((cell) => cell.textContent))
      .toEqual(["처리 목적", "처리 항목", "처리 근거", "보유기간·삭제 기준"]);
    expect(within(table).getAllByRole("rowheader")).toHaveLength(12);
    const socialLoginRow = within(table).getByRole("row", { name: /소셜 로그인과 계정 식별/ });
    expect(socialLoginRow).toHaveTextContent("OAuth 제공자와 제공자 사용자 식별자");
    expect(socialLoginRow).not.toHaveTextContent("이메일");
    expect(socialLoginRow).not.toHaveTextContent("표시 이름");
    const sessionRow = within(table).getByRole("row", { name: /로그인과 가입 대기 세션/ });
    expect(sessionRow).toHaveTextContent("명로 사용자 식별자와 권한");
    expect(sessionRow).not.toHaveTextContent("이메일");
    expect(sessionRow).not.toHaveTextContent("표시 이름");
    expect(within(table).getByRole("row", { name: /사주 계산.*양력 생년월일.*처리 완료 시 폐기/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /AI 리딩 요청 처리.*명로 데이터베이스와 운영 로그에는 저장하지 않음/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /무료 오늘의 운세 이어보기.*SHA-256 계정 범위값.*현재 브라우저/ }))
      .toBeInTheDocument();
    const operationalLogRow = within(table).getByRole("row", {
      name: /서비스 보안과 오류·장애 대응.*리딩 식별자.*최대 30일/,
    });
    expect(operationalLogRow).toHaveTextContent("30일 경과 시 CloudWatch에서 만료·삭제 대상으로 표시");
    expect(operationalLogRow).toHaveTextContent("물리적 삭제는 통상 추가 72시간 이내");
    expect(operationalLogRow).toHaveTextContent("드물게 더 오래 걸릴 수 있음");
    expect(operationalLogRow).not.toHaveTextContent("최대 30일 후 자동 삭제");
    expect(within(table).getByRole("row", { name: /OpenAI를 통한 AI 리딩 생성.*국외이전 별도 동의.*최대 24시간/ }))
      .toBeInTheDocument();
    expect(within(table).getByRole("row", { name: /OpenAI를 통한 AI 리딩 생성/ }))
      .not.toHaveTextContent("가명 안전 식별자");
    const processorTable = screen.getByRole("table", {
      name: "OpenAI API 외부 처리자와 처리 가능 국가",
    });
    expect(within(processorTable).getByRole("row", {
      name: /직접 이전받는 자.*OpenAI OpCo, LLC.*미국/,
    })).toBeInTheDocument();
    expect(within(processorTable).getByRole("row", {
      name: /API 클라우드 인프라.*Microsoft Corporation.*대한민국/,
    })).toBeInTheDocument();
    expect(within(processorTable).getByRole("row", {
      name: /조건부 콘텐츠 검토·고객지원.*TaskUs, LLC.*필리핀/,
    })).toBeInTheDocument();
    expect(within(processorTable).getByRole("row", {
      name: /동적 네트워크 처리.*Cloudflare, Ltd..*가장 가까운 데이터센터 소재국/,
    })).toBeInTheDocument();
    expect(screen.getByText(/정적 처리 국가 수는 국내 위치를 포함해 26개/))
      .toBeInTheDocument();
    expect(screen.getByText(/Global API는 미국에서만 처리되는 서비스가 아니며/))
      .toBeInTheDocument();
    expect(screen.getByText(/store=false는 이러한 오남용 감시 로그와 프롬프트 캐시를 제거하지 않습니다/))
      .toBeInTheDocument();
    expect(screen.getAllByText(/서비스 또는 제3자를 위해로부터 보호하기 위해 합리적으로 필요한 경우 더 오래 보관/))
      .toHaveLength(2);
    expect(screen.queryByText(/심각한 위해/)).not.toBeInTheDocument();
    expect(screen.getByText(/OpenAI 원문 갱신일 2026-07-09 · 명로 최종 확인일 2026-09-25/))
      .toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "개인정보 보호법 제15조 제1항 제4호" }))
      .toHaveLength(9);
    expect(screen.getByRole("link", { name: "개인정보 보호법 제28조의8 제1항 제1호" }))
      .toBeInTheDocument();
  });
});
