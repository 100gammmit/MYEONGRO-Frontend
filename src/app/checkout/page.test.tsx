import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import CheckoutPage from "./page";

type CheckoutSearchParams = {
  kind?: string;
  guestTransfer?: string | string[];
};

async function renderCheckoutPage(searchParams: CheckoutSearchParams = {}) {
  const Page = CheckoutPage as (props: {
    searchParams: Promise<CheckoutSearchParams>;
  }) => Promise<ReactElement>;

  return render(await Page({ searchParams: Promise.resolve(searchParams) }));
}

describe("CheckoutPage", () => {
  it("shows a safe alert when guest transfer failed", async () => {
    await renderCheckoutPage({ guestTransfer: "failed" });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("로그인은 완료됐지만 이전 기록 연결에 실패했어요");
    expect(alert).toHaveTextContent("다시 로그인");
    expect(alert).toHaveTextContent("잠시 후 재시도");
  });

  it("shows a safe alert when the first guest transfer value is failed", async () => {
    await renderCheckoutPage({ guestTransfer: ["failed", "success"] });

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it.each<[string, CheckoutSearchParams]>([
    ["guest transfer is absent", {}],
    ["guest transfer succeeds", { guestTransfer: "success" }],
    ["the first guest transfer value is not failed", { guestTransfer: ["success", "failed"] }],
  ])("stays quiet when %s", async (_label, searchParams) => {
    await renderCheckoutPage(searchParams);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps payment deferred without an active checkout action", async () => {
    await renderCheckoutPage({ kind: "tarot" });

    expect(screen.getByText("심층 리딩은 준비 중입니다")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /결제 계속/ })).not.toBeInTheDocument();
  });
});
