import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("describes the available account deletion control", () => {
    render(<PrivacyPage />);

    expect(screen.queryByText(/회원 탈퇴 시 계정 데이터 삭제를 요청/))
      .not.toBeInTheDocument();
    expect(screen.queryByText(/후속 마일스톤/)).not.toBeInTheDocument();
    expect(screen.getByText(/계정 설정에서 계정 전체 삭제를 요청할 수 있습니다/))
      .toBeInTheDocument();
  });
});
