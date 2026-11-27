import type { ReactElement } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import { dailyCardShareId } from "@/domain/daily-card-free/share-ids.server";

import SharedDailyCardPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

const STAR_ID = dailyCardShareId("major-17-star", 0)!;

async function renderShared(id: string) {
  const Page = SharedDailyCardPage as (props: { params: Promise<{ id: string }> }) => Promise<ReactElement>;
  return render(await Page({ params: Promise.resolve({ id }) }));
}

describe("SharedDailyCardPage", () => {
  it("pre-renders one page per share ID and nothing else", () => {
    expect(generateStaticParams()).toHaveLength(132);
    expect(generateStaticParams()).toContainEqual({ id: STAR_ID });
    expect(dynamicParams).toBe(false);
  });

  it("shows the shared result as drawn and the way to draw one's own", async () => {
    await renderShared(STAR_ID);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("작은 회복이 반짝여요");
    expect(screen.getByText("누군가 뽑은 오늘의 카드예요.")).toBeInTheDocument();
    expect(screen.getByText("오늘의 카드 · 별")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent("나아지고 있다는 증거가 하나 보여요");
    expect(screen.getByRole("link", { name: "나도 오늘의 카드 뽑기" })).toHaveAttribute("href", "/tarot/daily");
    expect(screen.queryByRole("button", { name: /공유하기/ })).not.toBeInTheDocument();
  });

  it("returns not found for an unknown ID", async () => {
    await expect(renderShared("AAAAAAAAAA")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("previews in messengers but stays out of search", async () => {
    const metadata = await generateMetadata({ params: Promise.resolve({ id: STAR_ID }) });
    expect(metadata.title).toBe("누군가 뽑은 오늘의 카드: 별 | 명로");
    expect(metadata.description).toBe("작은 회복이 반짝여요. 나도 로그인 없이 오늘의 카드 한 장 뽑아 보기");
    expect(metadata.robots).toEqual({ index: false, follow: true });
    expect(metadata.alternates).toBeUndefined();
    expect(metadata.openGraph?.images).toEqual([
      { url: `/tarot/daily/${STAR_ID}/opengraph-image`, width: 1200, height: 630, alt: "오늘의 카드 · 별" },
    ]);
    expect(await generateMetadata({ params: Promise.resolve({ id: "AAAAAAAAAA" }) })).toEqual({});
  });
});
