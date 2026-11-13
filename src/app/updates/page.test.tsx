import { fireEvent, render, screen, within } from "@testing-library/react";

import { defineServiceUpdates } from "@/domain/service-updates/model";
import { ServiceUpdatesPageContent } from "@/components/service-updates-page-content";

describe("UpdatesPage", () => {
  it("shows an honest empty state before any public update exists", () => {
    render(<ServiceUpdatesPageContent updates={[]} today="2026-09-28" />);

    expect(screen.getByRole("heading", { level: 1, name: "업데이트 소식" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "아직 등록된 소식이 없습니다." })).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
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

    const { container } = render(<ServiceUpdatesPageContent updates={updates} today="2026-09-28" />);

    const month = screen.getByRole("region", { name: "2026년 9월" });
    const entries = [...container.querySelectorAll<HTMLElement>(".update-entry")];
    expect(entries.map((entry) => within(entry).getByRole("heading", { level: 3 }).textContent))
      .toEqual(["이용약관 변경 예정", "기록 화면 개선 내용 정정", "기록 화면 개선"]);
    expect(within(month).getAllByRole("listitem").filter((item) => item.classList.contains("update-entry")))
      .toHaveLength(3);

    // Only exceptions carry a mark; an applied routine notice shows its category alone.
    expect(within(entries[0]).getByText("시행 예정")).toBeInTheDocument();
    expect(within(entries[0]).getByText("중요 안내")).toBeInTheDocument();
    expect(within(entries[0]).getByText("9. 23. 게시 · 9. 30. 시행")).toBeInTheDocument();
    expect(within(entries[2]).getByText("9. 20.")).toBeInTheDocument();
    expect(within(entries[2]).queryByText("적용됨")).not.toBeInTheDocument();
    expect(within(entries[2]).queryByText("업데이트")).not.toBeInTheDocument();

    // Changes start folded; related links stay visible.
    const details = entries[0].querySelector("details")!;
    expect(details.open).toBe(false);
    fireEvent.click(within(entries[0]).getByText("자세히 보기"));
    expect(details.open).toBe(true);
    expect(within(entries[0]).getByRole("link", { name: "서비스 이용약관" }))
      .toHaveAttribute("href", "/terms");

    expect(screen.queryByText("아직 공개하지 않은 변경")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "정정 대상 원문 보기" }))
      .toHaveAttribute("href", "/updates#original");
    expect(within(entries[1]).getByText("정정")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "정정 내용 보기" }))
      .toHaveAttribute("href", "/updates#correction");
  });

  it("opens the notice a link points at", () => {
    window.location.hash = "#target";
    const updates = defineServiceUpdates([
      {
        id: "target",
        category: "release",
        noticeLevel: "routine",
        title: "가리키는 공지",
        summary: "요약",
        changes: ["변경 내용"],
        publishedDate: "2026-09-20",
        effectiveDate: "2026-09-20",
      },
    ]);

    const { container } = render(<ServiceUpdatesPageContent updates={updates} today="2026-09-28" />);

    expect(container.querySelector<HTMLDetailsElement>("#target details")!.open).toBe(true);
    window.location.hash = "";
  });

  it("names an emergency notice once and keeps its reason visible", () => {
    const updates = defineServiceUpdates([
      {
        id: "emergency",
        category: "emergency",
        noticeLevel: "emergency",
        title: "긴급 점검",
        summary: "리딩 생성을 잠시 멈춥니다.",
        changes: ["생성 요청을 받지 않습니다."],
        publishedDate: "2026-09-20",
        effectiveDate: "2026-09-20",
        emergencyReason: "외부 서비스 장애",
      },
    ]);

    const { container } = render(<ServiceUpdatesPageContent updates={updates} today="2026-09-28" />);

    const entry = container.querySelector<HTMLElement>(".update-entry")!;
    expect(within(entry).getAllByText("긴급 안내")).toHaveLength(1);
    expect(within(entry).getByText("외부 서비스 장애")).toBeVisible();
  });
});
