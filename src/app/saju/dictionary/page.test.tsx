import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ELEMENT_SLUGS, TEN_GOD_SLUGS } from "@/domain/saju-dictionary";

import ElementPage, { generateMetadata as elementMetadata } from "./elements/[slug]/page";
import SajuDictionaryPage from "./page";
import TenGodPage, { generateMetadata as tenGodMetadata } from "./ten-gods/[slug]/page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("saju dictionary hub", () => {
  it("links every written entry from the judging table and the lists, with no placeholders", () => {
    render(<SajuDictionaryPage />);
    expect(screen.getByRole("heading", { level: 1, name: "만세력 용어, 하나씩 풀어 봅니다" })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: /십성 판정표/ });
    expect(within(table).getAllByRole("link")).toHaveLength(10);
    const list = screen.getByRole("region", { name: "십성 열 가지" });
    expect(within(list).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(TEN_GOD_SLUGS.map((slug) => `/saju/dictionary/ten-gods/${slug}`));
    const five = screen.getByRole("region", { name: "오행 다섯 가지" });
    expect(within(five).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(ELEMENT_SLUGS.map((slug) => `/saju/dictionary/elements/${slug}`));
    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument();
  });
});

describe("ten god page", () => {
  it("marks its own cell, outlines its pair and gives a full page of text", async () => {
    render(await TenGodPage(params("geopjae")));
    expect(screen.getByRole("heading", { level: 1, name: /겁재/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /겁재는 이렇게 정해집니다/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: /비견과 무엇이 다른가요/ })).toBeInTheDocument();
    const table = screen.getByRole("table", { name: /십성 판정표/ });
    expect(within(table).getByRole("link", { name: "겁재" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("navigation", { name: "십성 열 가지" })).toBeInTheDocument();
    expect(screen.getByText("이 글은 AI로 만든 초안을 운영자가 검수했습니다.")).toBeInTheDocument();
    expect(screen.getByText(/사주 개념 사전은 전통 명리에서 쓰는 용어/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "무료 만세력으로 내 명식 보기" })).toHaveAttribute("href", "/manseryeok");
    expect(document.body.textContent!.length).toBeGreaterThan(1500);
  });

  it("titles itself with the Hanja name and refuses an unknown slug", async () => {
    expect(await tenGodMetadata(params("sanggwan"))).toMatchObject({ title: "상관(傷官) 뜻: 사주 개념 사전 | 명로", alternates: { canonical: "/saju/dictionary/ten-gods/sanggwan" } });
    expect(await tenGodMetadata(params("nope"))).toEqual({});
  });
});

describe("every dictionary page", () => {
  it("runs between 1,500 and 4,500 characters of page text", async () => {
    for (const slug of TEN_GOD_SLUGS) {
      const { unmount, container } = render(await TenGodPage(params(slug)));
      expect(container.textContent!.length, slug).toBeGreaterThan(1500);
      expect(container.textContent!.length, slug).toBeLessThan(4500);
      unmount();
    }
    for (const slug of ELEMENT_SLUGS) {
      const { unmount, container } = render(await ElementPage(params(slug)));
      expect(container.textContent!.length, slug).toBeGreaterThan(1500);
      expect(container.textContent!.length, slug).toBeLessThan(4500);
      unmount();
    }
  });
});

describe("element page", () => {
  it("states the cycle with the right particles and a full page of text", async () => {
    render(await ElementPage(params("fire")));
    expect(screen.getByRole("heading", { level: 1, name: /화/ })).toBeInTheDocument();
    expect(screen.getByText("목이 화를 낳고, 화가 토를 낳음")).toBeInTheDocument();
    expect(screen.getByText("화가 금을 누르고, 수가 화를 누름")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "오행 다섯 가지" })).toBeInTheDocument();
    expect(document.body.textContent!.length).toBeGreaterThan(1500);
    expect(await elementMetadata(params("water"))).toMatchObject({ alternates: { canonical: "/saju/dictionary/elements/water" } });
  });
});
