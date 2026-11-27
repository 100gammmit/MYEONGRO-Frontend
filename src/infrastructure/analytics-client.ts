import type { AiTarotSpreadType } from "@/domain/tarot";
import type { ZodiacSlug } from "@/domain/zodiac-fortune/slugs";

// Every event and parameter Google Analytics may receive. Values are fixed enums or public slugs,
// so a question, birth data or a reading ID cannot be passed by accident.
export type AnalyticsEvent =
  | { name: "daily_card_draw" }
  | { name: "share"; params: { method: "share_sheet" | "copy_link"; content_type: "daily_card" } }
  | { name: "daily_card_share_view" }
  | { name: "zodiac_fortune_view"; params: { zodiac_sign: ZodiacSlug } }
  | { name: "reading_start" | "reading_complete"; params: ReadingEventParams };

export type ReadingEventParams =
  | { reading_type: "tarot"; spread_type: AiTarotSpreadType }
  | { reading_type: "saju"; report_type: "birth_annual_question" | "annual_monthly" };

type Gtag = (...args: unknown[]) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
  }
}

let configuredId: string | null = null;

// The gtag.js snippet, without the inline script: commands queue in dataLayer until the library
// loads. Page views are sent by hand so their address can be cleaned first.
export function ensureGtag(measurementId: string): Gtag {
  window.dataLayer = window.dataLayer ?? [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // gtag.js reads the arguments object itself, not an array copy.
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
  if (configuredId !== measurementId) {
    configuredId = measurementId;
    window.gtag("js", new Date());
    window.gtag("config", measurementId, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });
  }
  return window.gtag;
}

export function trackEvent(event: AnalyticsEvent): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  window.gtag("event", event.name, "params" in event ? event.params : {});
}

export function resetAnalyticsForTests(): void {
  configuredId = null;
}
