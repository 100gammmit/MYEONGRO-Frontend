// @vitest-environment node
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import sitemap from "./sitemap";
import robots from "./robots";
import { PRIVATE_PAGE_METADATA, SHARE_IMAGE, SITE_ORIGIN, publicPageMetadata } from "@/infrastructure/site-metadata";
import routes from "@/infrastructure/site-routes.json";
import { metadata as accountMetadata } from "./account/layout";
import { metadata as recordsMetadata } from "./records/layout";
import { metadata as loginMetadata } from "./login/layout";
import { metadata as signupMetadata } from "./signup/layout";
import { metadata as tarotMetadata } from "./tarot/results/layout";
import { metadata as sajuMetadata } from "./saju/results/layout";
import { metadata as drawMetadata } from "./tarot/draw/layout";

describe("search discovery boundaries", () => {
  it("classifies every routable page so new public pages cannot silently miss the sitemap", () => {
    const appRoot = path.join(process.cwd(), "src/app");
    const walk = (directory: string): string[] => readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const name = path.join(directory, entry.name);
      if (entry.isDirectory()) return walk(name);
      if (!/^page\.(tsx|ts|jsx|js|mdx)$/.test(entry.name)) return [];
      const segments = path.relative(appRoot, directory).split(path.sep).filter((segment) => segment && !/^\(.+\)$/.test(segment));
      return ["/" + segments.join("/")];
    });
    const actualPages = walk(appRoot);
    const isPrivate = (route: string) => routes.privateRoutePrefixes.some((prefix) => route === prefix || route.startsWith(`${prefix}/`));
    expect(actualPages.filter((route) => !isPrivate(route)).sort()).toEqual([...routes.publicPages].sort());
    expect(routes.publicPages.some(isPrivate)).toBe(false);
    for (const prefix of routes.privateRoutePrefixes) {
      expect(actualPages.some((route) => route === prefix || route.startsWith(`${prefix}/`))).toBe(true);
    }
  });

  it("gives public pages share metadata with their own title and canonical path", () => {
    const metadata = publicPageMetadata("/faq", "자주 묻는 질문 | 명로", "질문과 답");
    expect(metadata.openGraph).toEqual({
      title: "자주 묻는 질문 | 명로",
      description: "질문과 답",
      url: "/faq",
      siteName: "명로",
      locale: "ko_KR",
      type: "website",
      images: [SHARE_IMAGE],
    });
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image", images: [SHARE_IMAGE] });
  });

  it("rejects metadata for an unregistered public route", () => {
    expect(() => publicPageMetadata("/unregistered-public-article", "Example", "Example")).toThrow(/site-routes\.json/);
  });

  it("lists only existing public routes on the canonical production host", () => {
    const entries = sitemap();
    expect(new Set(entries.map((entry) => entry.url)).size).toBe(entries.length);
    for (const entry of entries) {
      const url = new URL(entry.url);
      expect(url.origin).toBe(SITE_ORIGIN);
      expect(url.search).toBe("");
      expect(url.pathname).not.toMatch(/^\/(?:api|auth|account|records|login|signup)(?:\/|$)|\/results(?:\/|$)|\/draw(?:\/|$)/);
      expect(existsSync(path.join(process.cwd(), "src/app", url.pathname, "page.tsx"))).toBe(true);
    }
    expect(entries.map((entry) => new URL(entry.url).pathname).sort()).toEqual([...routes.publicPages].sort());
  });

  it("permits public crawling and points to the canonical sitemap", () => {
    expect(robots()).toEqual({
      rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
      sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    });
  });

  it("marks account, identity and personal results as non-indexable", () => {
    for (const metadata of [accountMetadata, recordsMetadata, loginMetadata, signupMetadata, tarotMetadata, sajuMetadata, drawMetadata]) {
      expect(metadata.robots).toEqual({ index: false, follow: false });
      expect(metadata.alternates).toBeUndefined();
    }
    expect(PRIVATE_PAGE_METADATA.robots).toEqual({ index: false, follow: false });
  });
});
