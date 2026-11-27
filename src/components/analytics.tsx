"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import {
  PRIVATE_PAGE_TITLE,
  analyticsLocation,
  analyticsReferrer,
  isPrivateAnalyticsPath,
} from "@/infrastructure/analytics";
import { ensureGtag } from "@/infrastructure/analytics-client";

// Loads Google Analytics 4 and sends a page view for every App Router navigation. The address,
// referrer and title are cleaned first and set for the whole page, so the page view and any
// event after it never carry a reading ID or a query beyond the campaign tags.
export function Analytics({ measurementId }: { measurementId: string }) {
  const pathname = usePathname();
  // Client navigations keep the landing page's document.referrer, so later views name the
  // previous (already cleaned) page instead.
  const previousLocation = useRef<string | null>(null);

  useEffect(() => {
    const gtag = ensureGtag(measurementId);
    const { origin, search } = window.location;
    const location = analyticsLocation(origin, pathname, search);
    gtag("set", {
      page_location: location,
      page_referrer: previousLocation.current ?? analyticsReferrer(document.referrer, origin),
      page_title: isPrivateAnalyticsPath(pathname) ? PRIVATE_PAGE_TITLE : document.title,
    });
    gtag("event", "page_view");
    previousLocation.current = location;
  }, [measurementId, pathname]);

  return (
    <Script
      src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`}
      strategy="afterInteractive"
    />
  );
}
