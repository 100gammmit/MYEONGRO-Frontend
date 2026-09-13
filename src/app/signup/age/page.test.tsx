import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("./signup-age-confirmation", () => ({
  SignupAgeConfirmation: () => <button type="button">만 19세 이상이며 가입합니다</button>,
}));

import SignupAgePage from "./page";

describe("SignupAgePage", () => {
  it("asks for age only as the final step of a new social signup", () => {
    render(<SignupAgePage />);

    expect(screen.getByRole("heading", { name: "가입 자격을 확인해 주세요" }))
      .toBeInTheDocument();
    expect(screen.getByText(/소셜 계정 확인이 완료되었습니다/)).toBeInTheDocument();
  });
});
