import type { Metadata } from "next";

// Production redirects the apex domain to www; discovery URLs must use the same host.
export const SITE_ORIGIN = "https://www.myeongro.com";

export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  return { title, description, alternates: { canonical: `${SITE_ORIGIN}${path}` } };
}

export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
