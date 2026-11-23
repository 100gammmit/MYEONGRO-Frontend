import type { ReactElement } from "react";
import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

const mocks = vi.hoisted(() => ({
  notFound: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({ notFound: mocks.notFound }));

import ZodiacSignPage, { dynamicParams, generateMetadata, generateStaticParams } from "./page";

async function renderSign(sign: string) {
  const Page = ZodiacSignPage as (props: { params: Promise<{ sign: string }> }) => Promise<ReactElement>;
  return render(await Page({ params: Promise.resolve({ sign }) }));
}

describe("ZodiacSignPage", () => {
  it("pre-renders exactly the twelve signs", () => {
    expect(generateStaticParams().map(({ sign }) => sign)).toEqual([
      "rat", "ox", "tiger", "rabbit", "dragon", "snake", "horse", "sheep", "monkey", "rooster", "dog", "pig",
    ]);
    expect(dynamicParams).toBe(false);
  });

  it("shows the approved sections, the sign nav and the disclaimer", async () => {
    await renderSign("rat");

    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("2027 쥐띠 신년운세: 눈치와 재치로 미묘한 자리도 부드럽게 풀어 가는 해");
    expect(screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent)).toEqual([
      "한 줄 요약", "쥐띠 출생연도", "올해의 근거", "일과 생활", "관계", "돈", "몸의 리듬", "같은 띠 공통 글 안내", "함께 확인하면 좋은 안내",
    ]);
    const nav = screen.getByRole("navigation", { name: "띠별 운세" });
    expect(within(nav).getAllByRole("link")).toHaveLength(12);
    expect(within(nav).getByRole("link", { name: "쥐띠" })).toHaveAttribute("aria-current", "page");
    const years = screen.getByRole("list", { name: "쥐띠 출생연도" });
    expect(within(years).getAllByRole("listitem").map((item) => item.textContent)).toEqual([
      "1948무자년", "1960경자년", "1972임자년", "1984갑자년", "1996병자년", "2008무자년", "2020경자년",
    ]);
    expect(screen.getByRole("img", { name: /쥐 자리와 올해의 양 자리 사이: 원진·해/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "사주 한 해 리포트 보기" })).toHaveAttribute("href", "/saju?report=annual");
    expect(screen.getByRole("link", { name: "지지 자(子) 뜻 보기" })).toHaveAttribute("href", "/saju/dictionary/branches/ja");
    expect(screen.getByText("이 내용은 오락과 자기 성찰을 위한 것으로 전문적인 조언을 대신하지 않아요.")).toBeInTheDocument();
  });

  it("returns not found for a slug it does not pre-render", async () => {
    await expect(renderSign("cat")).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("titles each page by year and sign, naming 호랑이띠 only in the 범띠 description", async () => {
    const rat = await generateMetadata({ params: Promise.resolve({ sign: "rat" }) });
    expect(rat.title).toBe("2027 쥐띠 신년운세 | 명로");
    expect(rat.alternates?.canonical).toBe("/zodiac/rat");
    expect(rat.openGraph?.images).toEqual([{ url: "/zodiac/rat/opengraph-image", width: 1200, height: 630, alt: "2027 쥐띠 신년운세" }]);
    expect(rat.twitter?.images).toEqual(rat.openGraph?.images);
    const tiger = await generateMetadata({ params: Promise.resolve({ sign: "tiger" }) });
    expect(tiger.title).toBe("2027 범띠 신년운세 | 명로");
    expect(tiger.description).toMatch(/^범띠\(호랑이띠\): /);
  });
});
