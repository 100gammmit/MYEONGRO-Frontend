import { render, screen, within } from "@testing-library/react";

import { defineServiceUpdates } from "@/domain/service-updates/model";
import { ServiceUpdatesPageContent } from "@/components/service-updates-page-content";

describe("UpdatesPage", () => {
  it("shows an honest empty state before any public update exists", () => {
    render(<ServiceUpdatesPageContent updates={[]} today="2026-09-28" />);

    expect(screen.getByRole("heading", { name: "업데이트 소식" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "아직 등록된 소식이 없습니다." }))
      .toBeInTheDocument();
    expect(screen.queryByRole("list", { name: "명로 업데이트 목록" }))
      .not.toBeInTheDocument();
  });

  it("orders published notices, labels status, and links corrections", () => {
    const updates = defineServiceUpdates([
      {
        id: "original",
        category: "release",
        noticeLevel: "routine",
        title: "기록 화면 개선",
        summary: "기록을 더 쉽게 확인합니다.",
        changes: ["기록 화면 구성을 바꿨습니다."],
        publishedDate: "2026-09-20",
        effectiveDate: "2026-09-20",
      },
      {
        id: "correction",
        category: "release",
        noticeLevel: "routine",
        title: "기록 화면 개선 내용 정정",
        summary: "변경 범위를 바로잡습니다.",
        changes: ["기록 정렬 설명을 정정했습니다."],
        publishedDate: "2026-09-21",
        effectiveDate: "2026-09-21",
        correctionOf: "original",
      },
      {
        id: "upcoming",
        category: "policy",
        noticeLevel: "general",
        title: "이용약관 변경 예정",
        summary: "약관을 변경합니다.",
        changes: ["서비스 운영 조항을 정리합니다."],
        publishedDate: "2026-09-23",
        effectiveDate: "2026-09-30",
        links: [{ label: "서비스 이용약관", href: "/terms" }],
      },
      {
        id: "unpublished",
        category: "release",
        noticeLevel: "routine",
        title: "아직 공개하지 않은 변경",
        summary: "게시일 전입니다.",
        changes: ["게시일 전에는 보이지 않습니다."],
        publishedDate: "2026-10-01",
        effectiveDate: "2026-10-01",
      },
    ]);

    render(<ServiceUpdatesPageContent updates={updates} today="2026-09-28" />);

    const list = screen.getByRole("list", { name: "명로 업데이트 목록" });
    const entries = within(list).getAllByRole("listitem", { hidden: false })
      .filter((item) => item.classList.contains("update-entry"));
    expect(entries.map((entry) => within(entry).getByRole("heading").textContent))
      .toEqual(["이용약관 변경 예정", "기록 화면 개선 내용 정정", "기록 화면 개선"]);
    expect(within(entries[0]).getByText("시행 예정")).toBeInTheDocument();
    expect(within(entries[0]).getByRole("link", { name: "서비스 이용약관" }))
      .toHaveAttribute("href", "/terms");
    expect(screen.queryByText("아직 공개하지 않은 변경")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "정정 대상 원문 보기" }))
      .toHaveAttribute("href", "/updates#original");
    expect(within(entries[1]).getByText("정정")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "정정 내용 보기" }))
      .toHaveAttribute("href", "/updates#correction");
  });
});
