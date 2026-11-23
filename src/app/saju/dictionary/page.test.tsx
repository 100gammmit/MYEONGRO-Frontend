import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BASIC_STEP_IDS, ELEMENT_SLUGS, STEM_SLUGS, TEN_GOD_SLUGS } from "@/domain/saju-dictionary";

import SajuBasicsPage from "./basics/page";
import ElementPage, { generateMetadata as elementMetadata } from "./elements/[slug]/page";
import SajuDictionaryPage from "./page";
import StemPage, { generateMetadata as stemMetadata } from "./stems/[slug]/page";
import TenGodPage, { generateMetadata as tenGodMetadata } from "./ten-gods/[slug]/page";

const params = (slug: string) => ({ params: Promise.resolve({ slug }) });

describe("saju dictionary first page", () => {
  it("points the way: basics first, then every written entry by group, with no explanations or placeholders", () => {
    render(<SajuDictionaryPage />);
    expect(screen.getByRole("heading", { level: 1, name: "사주 용어 찾아보기" })).toBeInTheDocument();
    const headings = screen.getAllByRole("heading", { level: 2 }).map((heading) => heading.textContent);
    expect(headings).toEqual(["기초 개념", "십성", "오행", "천간"]);
    const basics = screen.getByRole("region", { name: "기초 개념" });
    expect(within(basics).getAllByRole("listitem").map((item) => within(item).getByRole("link").getAttribute("href")))
      .toEqual(BASIC_STEP_IDS.map((id) => `/saju/dictionary/basics#${id}`));
    const ten = screen.getByRole("region", { name: "십성" });
    expect(within(ten).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(TEN_GOD_SLUGS.map((slug) => `/saju/dictionary/ten-gods/${slug}`));
    const five = screen.getByRole("region", { name: "오행" });
    expect(within(five).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(ELEMENT_SLUGS.map((slug) => `/saju/dictionary/elements/${slug}`));
    const stems = screen.getByRole("region", { name: "천간" });
    expect(within(stems).getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(STEM_SLUGS.map((slug) => `/saju/dictionary/stems/${slug}`));
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.queryByRole("search")).not.toBeInTheDocument();
    expect(screen.getByText(/이 글은 AI로 만든 초안을 운영자가 검수했습니다\./)).toBeInTheDocument();
    expect(screen.queryByText(/준비 중/)).not.toBeInTheDocument();
  });
});

describe("saju basics page", () => {
  it("walks the six steps in order with the table and the cycle, and no editorial note", () => {
    const { container } = render(<SajuBasicsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "사주 읽기 기초" })).toBeInTheDocument();
    expect([...container.querySelectorAll("section[id]")].map((section) => section.id)).toEqual([...BASIC_STEP_IDS]);
    expect(screen.getByRole("table", { name: /십성 판정표/ })).toBeInTheDocument();
    expect(screen.getByText(/상생 · 목 → 화/)).toBeInTheDocument();
    expect(screen.queryByText(/AI로 만든 초안/)).not.toBeInTheDocument();
    expect(container.textContent!.length).toBeGreaterThan(1500);
    expect(container.textContent!.length).toBeLessThan(3000);
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
    expect(screen.queryByText(/AI로 만든 초안/)).not.toBeInTheDocument();
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
  it("runs between 1,500 and 3,000 characters of page text", async () => {
    for (const slug of TEN_GOD_SLUGS) {
      const { unmount, container } = render(await TenGodPage(params(slug)));
      expect(container.textContent!.length, slug).toBeGreaterThan(1500);
      expect(container.textContent!.length, slug).toBeLessThan(3000);
      unmount();
    }
    for (const slug of STEM_SLUGS) {
      const { unmount, container } = render(await StemPage(params(slug)));
      expect(container.textContent!.length, slug).toBeGreaterThan(1500);
      expect(container.textContent!.length, slug).toBeLessThan(3000);
      unmount();
    }
    for (const slug of ELEMENT_SLUGS) {
      const { unmount, container } = render(await ElementPage(params(slug)));
      expect(container.textContent!.length, slug).toBeGreaterThan(1500);
      expect(container.textContent!.length, slug).toBeLessThan(3000);
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

describe("stem page", () => {
  it("shows the ten god for every day stem, the combination and clash wheel, and links its pair", async () => {
    render(await StemPage(params("gap")));
    expect(screen.getByRole("heading", { level: 1, name: /갑/ })).toBeInTheDocument();
    const chips = screen.getByRole("list", { name: "일간마다 갑이 갖는 십성" });
    expect(within(chips).getAllByRole("link").map((link) => link.textContent)).toEqual(["비견", "겁재", "편인", "정인", "편관", "정관", "편재", "정재", "식신", "상관"]);
    expect(screen.getByRole("img", { name: "갑의 합과 충: 합 · 기(己)와 묶임 · 충 · 경(庚)과 마주 봄" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "을(乙)" })[0]).toHaveAttribute("href", "/saju/dictionary/stems/eul");
    expect(screen.getByRole("navigation", { name: "천간 열 글자" })).toBeInTheDocument();
    expect(screen.queryByText(/AI로 만든 초안/)).not.toBeInTheDocument();
  });

  it("says when a stem has no clash, and titles itself with the Hanja", async () => {
    render(await StemPage(params("mu")));
    expect(screen.getByRole("img", { name: /충을 이루는 천간 없음/ })).toBeInTheDocument();
    expect(await stemMetadata(params("sin"))).toMatchObject({ title: "천간 신(辛)의 뜻: 사주 개념 사전 | 명로", alternates: { canonical: "/saju/dictionary/stems/sin" } });
    expect(await stemMetadata(params("nope"))).toEqual({});
  });
});
