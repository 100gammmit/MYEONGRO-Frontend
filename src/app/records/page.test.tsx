import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import RecordsPage from "./page";

type RecordsSearchParams = {
  guestTransfer?: string;
};

async function renderRecordsPage(searchParams: RecordsSearchParams = {}) {
  const Page = RecordsPage as (props: {
    searchParams: Promise<RecordsSearchParams>;
  }) => Promise<ReactElement>;

  return render(await Page({ searchParams: Promise.resolve(searchParams) }));
}

describe("RecordsPage", () => {
  it("shows a safe alert when guest transfer failed", async () => {
    await renderRecordsPage({ guestTransfer: "failed" });

    const alert = screen.getByRole("alert");
    expect(alert).toHaveAttribute("aria-live", "assertive");
    expect(alert).toHaveTextContent("로그인은 완료했지만 이전 기록 연결에 실패했어요.");
    expect(alert).toHaveTextContent("다시 로그인");
    expect(alert).toHaveTextContent("잠시 후 재시도");
  });

  it("stays quiet when guest transfer is absent", async () => {
    await renderRecordsPage();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("stays quiet for non-failed guest transfer values", async () => {
    await renderRecordsPage({ guestTransfer: "success" });

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
