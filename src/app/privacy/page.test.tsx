import { render, screen } from "@testing-library/react";
import PrivacyPage from "./page";

describe("PrivacyPage", () => {
  it("does not promise account deletion before the Spring account API exists", () => {
    render(<PrivacyPage />);

    expect(screen.queryByText(/회원 탈퇴 시 계정 데이터 삭제를 요청/))
      .not.toBeInTheDocument();
    expect(screen.getByText(/계정 전체 삭제 기능은 후속 마일스톤에서 제공할 예정입니다/))
      .toBeInTheDocument();
  });
});
