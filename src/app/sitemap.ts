import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/infrastructure/site-metadata";
import routes from "@/infrastructure/site-routes.json";

// Fixed public pages only: personal records and query strings must never be enumerated.
export default function sitemap(): MetadataRoute.Sitemap {
  return routes.publicPages.map((path) => ({ url: new URL(path, SITE_ORIGIN).href }));
}
