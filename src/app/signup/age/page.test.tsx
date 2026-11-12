import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("./signup-age-confirmation", () => ({
  SignupAgeConfirmation: () => <h1>가입 전에 두 가지만 확인해 주세요</h1>,
}));

import SignupAgePage from "./page";

describe("SignupAgePage", () => {
  it("frames the confirmation as the sign-up step after login", () => {
    render(<SignupAgePage />);

    expect(screen.getByRole("link", { name: /로그인/ })).toHaveAttribute("href", "/login");
    expect(screen.getByText("회원 가입")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "가입 전에 두 가지만 확인해 주세요" })).toBeInTheDocument();
  });
});
