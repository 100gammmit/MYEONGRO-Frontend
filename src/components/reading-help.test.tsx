import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import FaqPage, { metadata as faqMetadata } from "@/app/faq/page";
import TarotGuidePage, { metadata as tarotMetadata } from "@/app/guide/tarot/page";
import SajuGuidePage, { metadata as sajuMetadata } from "@/app/guide/saju/page";
import { FAQ_GROUPS, SAJU_GUIDE, TAROT_GUIDE } from "@/content/reading-help";
import { ReadingGuideLink, ReadingHelpEntry } from "./reading-help-links";

const originalScroll = Object.getOwnPropertyDescriptor(Element.prototype, "scrollIntoView");
afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
  if (originalScroll) Object.defineProperty(Element.prototype, "scrollIntoView", originalScroll);
  else Reflect.deleteProperty(Element.prototype, "scrollIntoView");
});

describe("public reading help", () => {
  it("renders twelve practical questions in three groups, with answer text in server HTML", () => {
    const html = renderToStaticMarkup(<FaqPage />);
    expect(html).toContain("원본 생년월일");
    expect(html).toContain("OpenAI");
    const { container } = render(<FaqPage />);
    expect(screen.getByRole("heading", { level: 1, name: "자주 묻는 질문" })).toBeInTheDocument();
    expect(container.querySelectorAll("details")).toHaveLength(12);
    expect(container.querySelectorAll("details[open]")).toHaveLength(0);
    for (const group of FAQ_GROUPS) {
      expect(screen.getByRole("heading", { level: 2, name: group.title })).toBeInTheDocument();
    }
    const detail = container.querySelector("details")!;
    fireEvent.click(detail.querySelector("summary")!);
    expect(detail.open).toBe(true);
    fireEvent.click(detail.querySelector("summary")!);
    expect(detail.open).toBe(false);
  });

  it("opens and focuses a linked question on arrival and hash changes", () => {
    const scroll = vi.fn();
    Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, value: scroll });
    window.history.replaceState(null, "", "/faq#birth-time");
    render(<FaqPage />);
    const first = document.getElementById("birth-time") as HTMLDetailsElement;
    expect(first.open).toBe(true);
    expect(first.querySelector("summary")).toHaveFocus();
    act(() => { window.history.replaceState(null, "", "/faq#credits"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect((document.getElementById("credits") as HTMLDetailsElement).open).toBe(true);
    expect(scroll).toHaveBeenCalledTimes(2);
  });

  it("ignores unknown or malformed hashes without hiding content", () => {
    window.history.replaceState(null, "", "/faq#%E0%A4%A");
    const { container } = render(<FaqPage />);
    act(() => { window.history.replaceState(null, "", "/faq#unknown"); window.dispatchEvent(new HashChangeEvent("hashchange")); });
    expect(container.querySelectorAll("details")).toHaveLength(12);
    expect(container.querySelectorAll("details[open]")).toHaveLength(0);
  });

  it.each([
    { Page: TarotGuidePage, guide: TAROT_GUIDE },
    { Page: SajuGuidePage, guide: SAJU_GUIDE },
  ])("renders $guide.kind guide from preparation through results", ({ Page, guide }) => {
    render(<Page />);
    expect(screen.getByRole("heading", { level: 1, name: guide.title })).toBeInTheDocument();
    const toc = screen.getByRole("navigation", { name: "가이드 목차" });
    for (const section of guide.sections) {
      expect(within(toc).getByRole("link", { name: section.title })).toHaveAttribute("href", `#${section.id}`);
      expect(document.getElementById(section.id)).toBeInTheDocument();
    }
    expect(screen.getAllByText(/가상 사례/).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: /리딩 시작하기/ })).toHaveAttribute("href", `/${guide.kind}`);
    expect(renderToStaticMarkup(<Page />)).toContain("read-result");
  });

  it("keeps input-time help in a new tab with no input in the URL", () => {
    render(<><ReadingGuideLink kind="tarot" /><ReadingGuideLink kind="saju" /></>);
    for (const link of screen.getAllByRole("link")) {
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
      expect(link).toHaveTextContent("새 탭");
      expect(link.getAttribute("href")).toMatch(/^\/guide\/(tarot|saju)$/);
    }
  });

  it("connects the home entry to all three public pages and provides metadata", () => {
    render(<ReadingHelpEntry />);
    expect(screen.getAllByRole("link").map((link) => link.getAttribute("href"))).toEqual(["/guide/tarot", "/guide/saju", "/faq"]);
    for (const metadata of [faqMetadata, tarotMetadata, sajuMetadata]) {
      expect(metadata.title).toMatch(/명로/);
      expect(metadata.description).toBeTruthy();
    }
  });

  it("uses unique anchors and resolves all cross-page FAQ and guide references", () => {
    const ids = FAQ_GROUPS.flatMap((group) => [group.id, ...group.items.map((item) => item.id)]);
    expect(new Set(ids).size).toBe(ids.length);
    const anchors: Record<string, string[]> = {
      "/faq": ids,
      "/guide/tarot": TAROT_GUIDE.sections.map((section) => section.id),
      "/guide/saju": SAJU_GUIDE.sections.map((section) => section.id),
    };
    const links = [
      ...FAQ_GROUPS.flatMap((group) => group.items.flatMap((item) => item.links ?? [])),
      ...[TAROT_GUIDE, SAJU_GUIDE].flatMap((guide) => [...guide.related, ...guide.sections.flatMap((section) => section.links ?? [])]),
    ];
    for (const link of links) {
      const [path, id] = link.href.split("#");
      if (id) expect(anchors[path]).toContain(id);
    }
  });
});
