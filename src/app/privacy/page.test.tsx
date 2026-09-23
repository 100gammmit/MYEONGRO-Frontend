import { render, screen } from "@testing-library/react";
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
    expect(screen.getByRole("heading", { name: "사주 출생정보의 일시적 처리" }))
      .toBeInTheDocument();
    expect(screen.getByText(/양력 생년월일, 출생시각 또는 출생시각 정확도, 출생 시·도, 대운 계산 기준/))
      .toBeInTheDocument();
    expect(screen.getByText(/명식·흐름 계산과 AI에 전달할 최소 계산정보 생성/))
      .toBeInTheDocument();
    expect(screen.getByRole("link", { name: "개인정보 보호법 제15조 제1항 제4호" }))
      .toBeInTheDocument();
    expect(screen.getByText(/사주 계산 요청 처리 완료 시까지/)).toBeInTheDocument();
    expect(screen.getByText(/원본 출생정보는 별도 데이터베이스에 저장하지 않고 OpenAI API에도 전송하지 않습니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/요청 처리 종료 시 메모리에서 해제됩니다/)).toBeInTheDocument();
    expect(screen.getByText(/요청 중복 방지를 위한 원문 미포함 식별값/)).toBeInTheDocument();
    expect(screen.getByText(/개별 리딩을 삭제하거나 계정을 삭제할 때 즉시 영구 삭제/))
      .toBeInTheDocument();
    expect(screen.getByText(/질문·선택지·관심 분야는 AI 리딩 생성 중에만 사용하고 명로 데이터베이스에는 저장하지 않습니다/))
      .toBeInTheDocument();
    expect(screen.getByText(/만 19세 이상 확인 여부와 정책 버전·확인 시각/))
      .toBeInTheDocument();
    expect(screen.getByText(/연령 확인을 위해 생년월일이나 신분증 정보는 수집하지 않습니다/))
      .toBeInTheDocument();
  });
});
