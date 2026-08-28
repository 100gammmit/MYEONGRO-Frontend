import { render, screen } from "@testing-library/react";

import TermsPage from "./page";

describe("TermsPage", () => {
  it("states the reading purpose and credit behavior", () => {
    render(<TermsPage />);

    expect(screen.getByRole("heading", { name: "서비스 이용약관" })).toBeInTheDocument();
    expect(screen.getByText(/자기 성찰과 오락을 위한 참고 정보/)).toBeInTheDocument();
    expect(screen.getByText(/화면에 안내된 크레딧이 사용됩니다/)).toBeInTheDocument();
  });
});
