import type { Metadata } from "next";
import routes from "./site-routes.json";

// Production redirects the apex domain to www; discovery URLs must use the same host.
export const SITE_ORIGIN = routes.origin;

export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  if (!routes.publicPages.includes(path)) {
    throw new Error(`Register public page in site-routes.json before adding metadata: ${path}`);
  }
  // Root metadataBase supplies the host; each page owns only its canonical path.
  return { title, description, alternates: { canonical: path } };
}

export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
