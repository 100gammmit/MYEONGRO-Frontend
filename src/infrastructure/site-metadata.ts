import type { Metadata } from "next";
import routes from "./site-routes.json";

// Production redirects the apex domain to www; discovery URLs must use the same host.
export const SITE_ORIGIN = routes.origin;

// Served by src/app/rss.xml/route.ts.
export const SERVICE_UPDATES_FEED_PATH = "/rss.xml";

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

type ShareImage = typeof SHARE_IMAGE;

export const SHARE_IMAGE_SIZE = { width: SHARE_IMAGE.width, height: SHARE_IMAGE.height };

/** The image an opengraph-image.tsx file beside `path` draws, named explicitly for publicPageMetadata. */
export function generatedShareImage(path: string, alt: string): ShareImage {
  return { url: `${path}/opengraph-image`, ...SHARE_IMAGE_SIZE, alt };
}

// A page may name its own generated share image; explicit images win over the file convention.
export function publicPageMetadata(path: string, title: string, description: string, image: ShareImage = SHARE_IMAGE): Metadata {
  if (!routes.publicPages.includes(path)) {
    throw new Error(`Register public page in site-routes.json before adding metadata: ${path}`);
  }
  // Root metadataBase supplies the host; each page owns only its canonical path.
  return {
    title,
    description,
    // Advertises the notices feed so crawlers that read RSS (Naver) can find it from any public page.
    alternates: { canonical: path, types: { "application/rss+xml": SERVICE_UPDATES_FEED_PATH } },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "명로",
      locale: "ko_KR",
      type: "website",
      images: [image],
    },
    twitter: { ...SHARE_TWITTER, images: [image], title, description },
  };
}

// A page reached only through a link someone shared: it previews well in messengers but stays out of
// search, and it is not a canonical page of its own.
export function sharedPageMetadata(path: string, title: string, description: string, image: ShareImage): Metadata {
  return {
    title,
    description,
    robots: { index: false, follow: true },
    openGraph: {
      title,
      description,
      url: path,
      siteName: "명로",
      locale: "ko_KR",
      type: "website",
      images: [image],
    },
    twitter: { ...SHARE_TWITTER, images: [image], title, description },
  };
}

export const PRIVATE_PAGE_METADATA: Metadata = {
  robots: { index: false, follow: false },
};
