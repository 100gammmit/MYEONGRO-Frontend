import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/infrastructure/site-metadata";

// Fixed public pages only: personal records and query strings must never be enumerated.
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "/", "/tarot", "/tarot/daily", "/saju", "/faq",
    "/guide/tarot", "/guide/tarot/example", "/guide/saju", "/guide/saju/annual-report",
    "/about/reading", "/updates", "/terms", "/privacy",
  ].map((path) => ({ url: `${SITE_ORIGIN}${path}` }));
}
