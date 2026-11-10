import type { Metadata } from "next";
import routes from "./site-routes.json";

// Production redirects the apex domain to www; discovery URLs must use the same host.
export const SITE_ORIGIN = routes.origin;

// One share image for every page. A page that sets its own openGraph replaces the inherited one,
// so the image is named explicitly instead of relying on the root-only file convention.
export const SHARE_IMAGE = {
  url: "/images/og.png",
  width: 1200,
  height: 630,
  alt: "명로: AI 타로와 사주. 카드 한 장과 사주 명식이 나란히 놓인 이미지",
};

export const SHARE_TWITTER = {
  card: "summary_large_image",
  images: [SHARE_IMAGE],
} satisfies NonNullable<Metadata["twitter"]>;

export function publicPageMetadata(path: string, title: string, description: string): Metadata {
  if (!routes.publicPages.includes(path)) {
    throw new Error(`Register public page in site-routes.json before adding metadata: ${path}`);
  }
  // Root metadataBase supplies the host; each page owns only its canonical path.
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "명로",
      locale: "ko_KR",
      type: "website",
      images: [SHARE_IMAGE],
    },
    twitter: { ...SHARE_TWITTER, title, description },
  };
}

export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
