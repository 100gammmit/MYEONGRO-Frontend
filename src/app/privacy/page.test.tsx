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
    expect(screen.getByText(/질문과 선택지 원문은 AI 리딩 생성 중에만 사용/))
      .toBeInTheDocument();
    expect(screen.getByText(/OpenAI OpCo, LLC의 Global API/)).toBeInTheDocument();
    expect(screen.getByText(/만 19세 이상 확인 여부와 정책 버전·확인 시각/))
      .toBeInTheDocument();
    expect(screen.getByText(/연령 확인을 위해 생년월일이나 신분증 정보는 수집하지 않습니다/))
      .toBeInTheDocument();
  });
});
