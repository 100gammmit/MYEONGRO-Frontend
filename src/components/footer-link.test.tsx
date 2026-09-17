import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/about/reading" }));
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }));

import { FooterLink } from "./footer-link";

describe("FooterLink", () => {
  it("marks only the link to the page being viewed as current", () => {
    render(
      <>
        <FooterLink href="/about/reading">명로의 리딩 방식</FooterLink>
        <FooterLink href="/privacy">개인정보 처리방침</FooterLink>
      </>,
    );

    expect(screen.getByRole("link", { name: "명로의 리딩 방식" }))
      .toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "개인정보 처리방침" }))
      .not.toHaveAttribute("aria-current");
  });
});
