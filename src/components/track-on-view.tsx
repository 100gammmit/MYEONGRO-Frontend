"use client";

import { useEffect } from "react";

import { trackEvent, type AnalyticsEvent } from "@/infrastructure/analytics-client";

// Lets a server-rendered page report that it was viewed. The layout renders <Analytics> ahead of
// the page, so its effect sets this page's cleaned address before this one sends the event; the
// event is a no-op while analytics is not loaded.
export function TrackOnView({ event }: { event: AnalyticsEvent }) {
  const key = JSON.stringify(event);

  useEffect(() => {
    trackEvent(JSON.parse(key) as AnalyticsEvent);
  }, [key]);

  return null;
}
