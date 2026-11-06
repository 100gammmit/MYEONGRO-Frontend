import { render, screen, within } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import TarotExamplePage, { metadata as tarotMetadata } from "@/app/guide/tarot/example/page";
import AnnualReportGuidePage, { metadata as annualMetadata } from "@/app/guide/saju/annual-report/page";
import { TAROT_READING_EXAMPLE, SAJU_ANNUAL_REPORT_GUIDE } from "@/content/public-reading-articles";
import { TAROT_GUIDE, SAJU_GUIDE } from "@/content/reading-help";

describe("public reading articles", () => {
  it.each([
    { Page: TarotExamplePage, article: TAROT_READING_EXAMPLE, path: "/guide/tarot/example", metadata: tarotMetadata },
    { Page: AnnualReportGuidePage, article: SAJU_ANNUAL_REPORT_GUIDE, path: "/guide/saju/annual-report", metadata: annualMetadata },
  ])("renders $path as fixed server content with a working table of contents", ({ Page, article, path, metadata }) => {
    const html = renderToStaticMarkup(<Page />);
    const { container } = render(<Page />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(article.title);
    expect(article.editorialNote).toBeTruthy();
    expect(html).toContain(article.editorialNote);
    const toc = screen.getByRole("navigation", { name: "가이드 목차" });
    for (const link of within(toc).getAllByRole("link")) {
      const id = link.getAttribute("href")!.slice(1);
      expect(container.querySelector(`[id="${id}"]`)).toBeInTheDocument();
    }
    const ids = [...container.querySelectorAll("[id]")].map((node) => node.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(container.querySelectorAll("form, input, button")).toHaveLength(0);
    expect(metadata.alternates?.canonical).toBe(path);
    expect(metadata.description).toBeTruthy();
    expect(screen.getByRole("link", { name: /리딩 시작하기/ })).toHaveAttribute("href", `/${article.kind}`);
  });

  it("connects both existing guides to the matching public article", () => {
    expect(TAROT_GUIDE.related.some((link) => link.href === "/guide/tarot/example")).toBe(true);
    expect(SAJU_GUIDE.related.some((link) => link.href === "/guide/saju/annual-report")).toBe(true);
  });
});
