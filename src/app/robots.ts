import type { MetadataRoute } from "next";
import { SITE_ORIGIN } from "@/infrastructure/site-metadata";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/auth/"] },
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
  };
}
