// @vitest-environment node
import { existsSync } from "node:fs";
import path from "node:path";
import sitemap from "./sitemap";
import robots from "./robots";
import { PRIVATE_PAGE_METADATA, SITE_ORIGIN } from "@/infrastructure/site-metadata";
import { metadata as accountMetadata } from "./account/layout";
import { metadata as recordsMetadata } from "./records/layout";
import { metadata as loginMetadata } from "./login/layout";
import { metadata as signupMetadata } from "./signup/layout";
import { metadata as tarotMetadata } from "./tarot/results/layout";
import { metadata as sajuMetadata } from "./saju/results/layout";
import { metadata as drawMetadata } from "./tarot/draw/layout";

describe("search discovery boundaries", () => {
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
    for (const route of ["/guide/tarot/example", "/guide/saju/annual-report"]) {
      expect(entries.map((entry) => entry.url)).toContain(`${SITE_ORIGIN}${route}`);
    }
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
