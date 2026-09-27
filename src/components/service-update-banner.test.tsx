import { act, render, screen, within } from "@testing-library/react";
import { afterEach, vi } from "vitest";

import { defineServiceUpdates } from "@/domain/service-updates/model";

import { ServiceUpdateBanner } from "./service-update-banner";
import { ServiceUpdateBannerLive } from "./service-update-banner-live";

const navigation = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => navigation }));

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
  afterEach(() => {
    vi.useRealTimers();
    navigation.refresh.mockReset();
  });

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

  it("keeps unpublished entries out of the client-rendered banner", () => {
    render(<ServiceUpdateBanner updates={updates} today="2026-09-30" />);

    expect(screen.queryByText("이용약관 변경")).not.toBeInTheDocument();
  });

  it("refreshes at Korea midnight and shows a newly published notice without remounting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-01T14:59:59.900Z"));
    const newlyPublished = updates.filter((update) => update.id === "2026-10-02-emergency");
    const { rerender } = render(
      <ServiceUpdateBannerLive initialToday="2026-10-01" publishedUpdates={[]} />,
    );
    expect(screen.queryByText("일부 생성 일시 중단")).not.toBeInTheDocument();

    act(() => vi.advanceTimersByTime(200));
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
    rerender(
      <ServiceUpdateBannerLive initialToday="2026-10-02" publishedUpdates={newlyPublished} />,
    );

    expect(screen.getByText("일부 생성 일시 중단")).toBeInTheDocument();
  });

  it("removes an expired notice after Korea midnight without remounting", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-08T14:59:59.900Z"));
    const adverse = updates.filter((update) => update.id === "2026-09-01-adverse");
    render(
      <ServiceUpdateBannerLive initialToday="2026-10-08" publishedUpdates={adverse} />,
    );
    expect(screen.getByText("무료 크레딧 변경")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(200));

    expect(screen.queryByText("무료 크레딧 변경")).not.toBeInTheDocument();
    expect(navigation.refresh).toHaveBeenCalledTimes(1);
  });

  it("refreshes published entries when a visible tab returns", () => {
    render(<ServiceUpdateBannerLive initialToday="2026-10-01" publishedUpdates={[]} />);

    act(() => document.dispatchEvent(new Event("visibilitychange")));

    expect(navigation.refresh).toHaveBeenCalledTimes(1);
  });
});
