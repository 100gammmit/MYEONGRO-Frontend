// Google Analytics 4 only ever sees the shapes built here: private paths lose their reading and
// record IDs, and query strings keep nothing but the campaign (UTM) tags.
const MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]{4,20}$/;

const CAMPAIGN_PARAMS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

// Paths whose last segment is a reading or record ID; the ID is replaced before anything is sent.
const PRIVATE_ID_PATHS = ["/tarot/results/", "/saju/results/", "/records/"] as const;

export const PRIVATE_PAGE_TITLE = "명로";

export function gaMeasurementId(value: string | undefined = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID): string | null {
  const id = value?.trim();
  return id && MEASUREMENT_ID_PATTERN.test(id) ? id : null;
}

function privatePrefix(pathname: string): string | null {
  return PRIVATE_ID_PATHS.find((prefix) => pathname.startsWith(prefix)) ?? null;
}

export function isPrivateAnalyticsPath(pathname: string): boolean {
  return privatePrefix(pathname) !== null;
}

export function analyticsPath(pathname: string): string {
  const prefix = privatePrefix(pathname);
  return prefix ? `${prefix}:id` : pathname;
}

export function analyticsLocation(origin: string, pathname: string, search: string): string {
  const source = new URLSearchParams(search);
  const kept = new URLSearchParams();
  for (const key of CAMPAIGN_PARAMS) {
    const value = source.get(key);
    if (value) kept.set(key, value);
  }
  const query = kept.toString();
  return `${origin}${analyticsPath(pathname)}${query ? `?${query}` : ""}`;
}

// Another site's address is cut to its origin (the source is all that matters); one of ours goes
// through the same path rules as page views, without any query.
export function analyticsReferrer(referrer: string, origin: string): string {
  if (!referrer) return "";
  let url: URL;
  try {
    url = new URL(referrer);
  } catch {
    return "";
  }
  return url.origin === origin ? `${origin}${analyticsPath(url.pathname)}` : url.origin;
}
