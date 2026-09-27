import { render, screen, within } from "@testing-library/react";

import { defineServiceUpdates } from "@/domain/service-updates/model";

import { ServiceUpdateBanner } from "./service-update-banner";

const updates = defineServiceUpdates([
  {
    id: "2026-10-01-routine",
    category: "release",
    noticeLevel: "routine",
    title: "결과 화면 개선",
    summary: "읽기 흐름을 개선합니다.",
    changes: ["결과 화면을 정리합니다."],
    publishedDate: "2026-10-01",
    effectiveDate: "2026-10-01",
  },
  {
    id: "2026-10-01-general",
    category: "policy",
    noticeLevel: "general",
    title: "이용약관 변경",
    summary: "약관이 변경됩니다.",
    changes: ["서비스 운영 조항을 변경합니다."],
    publishedDate: "2026-10-01",
    effectiveDate: "2026-10-08",
  },
  {
    id: "2026-09-01-adverse",
    category: "credit",
    noticeLevel: "adverse",
    title: "무료 크레딧 변경",
    summary: "무료 크레딧이 변경됩니다.",
    changes: ["무료 지급량을 변경합니다."],
    publishedDate: "2026-09-01",
    effectiveDate: "2026-10-01",
  },
  {
    id: "2026-10-02-emergency",
    category: "emergency",
    noticeLevel: "emergency",
    title: "일부 생성 일시 중단",
    summary: "외부 장애에 대응합니다.",
    changes: ["신규 생성을 일시 중단합니다."],
    publishedDate: "2026-10-02",
    effectiveDate: "2026-10-02",
    emergencyReason: "외부 AI 제공자 장애로 즉시 조치했습니다.",
  },
]);

describe("ServiceUpdateBanner", () => {
  it("shows only active important notices in priority order", () => {
    render(<ServiceUpdateBanner updates={updates} today="2026-10-02" />);

    const banner = screen.getByRole("complementary", { name: "중요 업데이트" });
    expect(within(banner).getAllByRole("listitem").map((item) => item.textContent))
      .toEqual([
        expect.stringContaining("일부 생성 일시 중단"),
        expect.stringContaining("무료 크레딧 변경"),
        expect.stringContaining("이용약관 변경"),
      ]);
    expect(within(banner).queryByText("결과 화면 개선")).not.toBeInTheDocument();
    expect(within(banner).getByRole("link", { name: /이용약관 변경/ }))
      .toHaveAttribute("href", "/updates#2026-10-01-general");
    expect(within(banner).queryByRole("button")).not.toBeInTheDocument();
  });

  it("renders nothing when there is no active important notice", () => {
    const { container } = render(
      <ServiceUpdateBanner updates={updates} today="2026-10-16" />,
    );

    expect(container).toBeEmptyDOMElement();
  });
});
